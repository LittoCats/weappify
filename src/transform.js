/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-04-01 18:40:09
 * 
 * Copyright 2019-04-01 程巍巍
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */

const path = require("path");
const fs = require("fs");

const babylon = require("babylon");
const traverse = require("babel-traverse").default;
const generate = require("babel-generator").default;

const getUid = require("./uid");

module.exports = function transform(options) {
  const file = options.file;
  const sourceDir = options.sourceDir;
  const dependencies = options.dependencies;

  const name = path.relative(sourceDir, file);
  if (dependencies[name]) return dependencies[name];

  // 构建 dependency
  const dependency = {
    name: name,
    id: getUid()
  };

  dependencies[name] = dependency;

  const origin = fs.readFileSync(file, 'utf-8');
  const ast = babylon.parse(origin);

  traverse(ast, {
    enter(path) {
      if (path.isCallExpression()) {
        const callee = path.get('callee').node;
        if (callee.name == 'require') {
          const modulePaths = path.get('arguments');
          if (modulePaths.length > 0) {
            const module = modulePaths[0].node;
            const subfile = resolveSubmodule(file, module.value);
            if (
              module && typeof module.value == 'string' 
              // 绝对路径，说明是 node_modules 中的模块，不处理
              && /^\./.test(module.value)
              && sourceDir == subfile.slice(0, sourceDir.length)
            ) {
              // 添加到待处理列表
              const dependency = transform({
                file: subfile,
                sourceDir: sourceDir,
                dependencies: dependencies
              });
              path.replaceWithSourceString(`$weappify_require(${dependency.id})`)
            }
          }  
        }
      }
    }
  });

  dependency.source = generate(ast, {}, origin);

  return dependency;
}

function resolveSubmodule(parent, file) {
  return require.resolve(path.resolve(path.dirname(parent), file));
}
function resolveSubmoduleName(sourceDir, file) {
  return path.relative(sourceDir, file);
}