const parser = require("../parser");
const traverse = require("../traverse");
const generate = require("../generator");
const template = require("../template");

function transformSync(code, options) {
  // 1. parser
  const ast = parser.parse(code, options.parserOpts);
  // 4. 实现插件机制
  const pluginApi = {
    template,
  };
  // 4.1 plugin
  options.plugins &&
    options.plugins.forEach(([plugin, options]) => {
      const res = plugin(pluginApi, options);
      Object.assign(visitors, res.visitors);
    });

  // 4.2 preset 是插件的集合 并且执行顺序 从 右 -> 左 故需要先 reverse 取到插件在执行上述逻辑
  options.presets &&
    options.presets.reverse().forEach(([preset, options]) => {
      const plugins = preset(pluginApi, options);
      plugins.forEach(([plugin, options]) => {
        const res = plugin(pluginApi, options);
        Object.assign(visitors, res.visitor);
      });
    });
  const visitors = {};
  // 2. traverse
  traverse(ast, visitors);
  // 3. generate
  return generate(ast, code, options.fileName);
}
