/**
 * @Author 程巍巍
 * @Mail   littocats@gmail.com
 * @Create 2019-04-01 19:19:50
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

const wrappers = `
const modules = {};
function $define(id, factory){
  modules[id] = {
    factory: factory
  };
}
function $weappify_require(id) {
  var module = modules[id];
  if (!module) throw new Error("Module with id " + id + " not found.");
  if (module.exports) return module.exports;
  module.exports = {};
  module.factory(module.exports, module);
  delete module.factory;
  return module.exports;
}
`.replace(/\n+\s*/g, '');

module.exports = function (dependencies, entry) {
  const modules = Object.values(dependencies).map(function (dependency) {
    return `/* ${dependency.name} */\n$define(${dependency.id}, function(exports, module){\n${dependency.source.code}\n});`
  });
  if (typeof entry == 'number') {
    entry = Object.values(dependencies).filter(function(dependency){return dependency.id == entry}).pop();
  }
  return [wrappers].concat(modules).concat(`if (typeof module !== 'undefined') module.exports = $weappify_require(${entry.id}/* ${entry.name} */);`).join('\n');
}