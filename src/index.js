#!/usr/local/bin/node
/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-04-01 18:28:44
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

const path = require('path');
const fs = require('fs');

const commander = require("commander");

const transform = require("./transform");
const findEntry = require("./find-entry");
const generate = require("./generate");

function setupCommander(program = commander) {
  program
    .version(require('../package.json').version, '-v, --version')
    .option('-e, --entry [string]', 'Entry file')
    .option('-o, --output [string]', 'Output file')
    .option('-s, --source [string]', 'Source dir, will not resolve these files out of source dir; defalut dirname(entry).')
    .parse(process.argv)
  ;
  return program;
}

function main() {
  
  const program = setupCommander();
  if (typeof program.entry !== 'string' || program.entry.length == 0) {
    return program.parse(process.argv.slice(0, 2).concat('-h'));
  }
 
  const entry = findEntry(program.entry);
  const sourceDir = (function() {
    if (typeof program.source == 'string' && program.source.length) {
      const source = path.resolve(process.cwd(), program.source);
      if (fs.existsSync(source)) return source;
    }
    return path.dirname(entry);
  })();

  /**
   * 依赖列表
   *  [name]:
   *    name: String 以 entry 所在目录为根目录的相对路径
   *    id: Number 唯一 id, 生成代码的引用，从1开始递增，0, 表示 entry 模块
   *    source: String 源码
   */
  const dependencies = {};

  const dependency = transform({
    sourceDir: sourceDir,
    file: entry,
    dependencies: dependencies
  });


  const source = generate(dependencies, 0);
  const buffer = Buffer.from(source, 'utf-8');
  
  // 如果设置了 output 则输出到指定的 output
  // 否则，输出到标准输出
  if (typeof program.output === 'string' && program.output.length) {
    const output = path.resolve(process.cwd(), program.output);
    let stat;
    if (fs.existsSync(output)) {
      stat = fs.statSync(output);
    }
    if (stat && !stat.isFile()) {
      throw new Error(`Output exists, but not regular file.`);
    }

    fs.writeFileSync(output, buffer);
  } else {
    process.stdout.write(buffer);
  }


}

if (module && require && module == require.main) {
  main();
}


