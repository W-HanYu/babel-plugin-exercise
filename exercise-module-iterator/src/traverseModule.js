const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const fs = require("fs");
const path = require("path");
const DependencyNode = require("./DependencyNode");

const visitedModules = new Set();

/**
 * 定义导入的类型
 */
const IMPORT_TYPE = {
  deconstruct: "deconstruct", // 解构导入
  default: "default", // 默认导入
  namespace: "namespace", // 命名空间导入
};

/**
 * 定义导出类型
 */

const EXPORT_TYPE = {
  all: "all", // 导出所有
  default: "default", // 默认导出
  named: "named", // 命名导出
};

/**
 * 解析 Babel 插件，根据文件扩展名确定需要使用的插件
 */
function resolveBabelSyntaxtPlugins(modulePath) {
  const plugins = [];
  if (["tsx", "jsx"].some((ext) => modulePath.endsWith(ext))) {
    plugins.push("jsx");
  }
  if (["ts", "tsx"].some((ext) => modulePath.endsWith(ext))) {
    plugins.push("typescript");
  }

  return plugins;
}

/**
 * 检查给定的文件路径是否是一个目录
 */
function isDirectory(filePath) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (e) {}
  return false;
}

/**
 * 确保模块路径的完整性，尝试添加文件扩展名
 */
function completeModulePath(modulePath) {
  const EXTS = [".tsx", ".ts", ".jsx", ".js"];
  if (modulePath.match(/\.[a-zA-Z]+$/)) {
    return modulePath;
  }

  //尝试完整路径，找到正确的模块文件
  function tryCompletePath(resolvePath) {
    for (let i = 0; i < EXTS.length; i++) {
      let tryPath = resolvePath(EXTS[i]);
      if (fs.existsSync(tryPath)) {
        return tryPath;
      }
    }
  }

  function reportModuleNotFoundError(modulePath) {
    throw "module not found: " + modulePath;
  }

  if (isDirectory(modulePath)) {
    const tryModulePath = tryCompletePath((ext) =>
      path.join(modulePath, "index" + ext)
    );
    if (!tryModulePath) {
      reportModuleNotFoundError(modulePath);
    } else {
      return tryModulePath;
    }
  } else if (!EXTS.some((ext) => modulePath.endsWith(ext))) {
    const tryModulePath = tryCompletePath((ext) => modulePath + ext);
    if (!tryModulePath) {
      reportModuleNotFoundError(modulePath);
    } else {
      return tryModulePath;
    }
  }
  return modulePath;
}

/**
 * 解析模块之间的依赖关系
 */
function moduleResolver(curModulePath, requirePath) {
  requirePath = path.resolve(path.dirname(curModulePath), requirePath);

  // 过滤掉第三方模块
  if (requirePath.includes("node_modules")) {
    return "";
  }

  requirePath = completeModulePath(requirePath);

  if (visitedModules.has(requirePath)) {
    return "";
  } else {
    visitedModules.add(requirePath);
  }
  return requirePath;
}

/**
 * 遍历 JavaScript 模块，构建依赖图谱
 */
function traverseJsModule(curModulePath, dependencyGrapthNode, allModules) {
  const moduleFileContent = fs.readFileSync(curModulePath, {
    encoding: "utf-8",
  });
  dependencyGrapthNode.path = curModulePath;

  // 使用 Babel 解析器解析模块文件内容
  const ast = parser.parse(moduleFileContent, {
    sourceType: "unambiguous",
    plugins: resolveBabelSyntaxtPlugins(curModulePath),
  });

  // 遍历 AST，检测导入和导出语句
  traverse(ast, {
    ImportDeclaration(path) {
      const subModulePath = moduleResolver(
        curModulePath,
        path.get("source.value").node
      );
      if (!subModulePath) {
        return;
      }

      const specifierPaths = path.get("specifiers");
      dependencyGrapthNode.imports[subModulePath] = specifierPaths.map(
        (specifierPath) => {
          if (specifierPath.isImportSpecifier()) {
            return {
              type: IMPORT_TYPE.deconstruct,
              imported: specifierPath.get("imported").node.name,
              local: specifierPath.get("local").node.name,
            };
          } else if (specifierPath.isImportDefaultSpecifier()) {
            return {
              type: IMPORT_TYPE.default,
              local: specifierPath.get("local").node.name,
            };
          } else {
            return {
              type: IMPORT_TYPE.namespace,
              local: specifierPath.get("local").node.name,
            };
          }
        }
      );

      // 创建子模块的依赖节点并递归遍历
      const subModule = new DependencyNode();
      traverseJsModule(subModulePath, subModule, allModules);
      dependencyGrapthNode.subModules[subModule.path] = subModule;
    },
    ExportDeclaration(path) {
      if (path.isExportNamedDeclaration()) {
        const specifiers = path.get("specifiers");
        dependencyGrapthNode.exports = specifiers.map((specifierPath) => ({
          type: EXPORT_TYPE.named,
          exported: specifierPath.get("exported").node.name,
          local: specifierPath.get("local").node.name,
        }));
      } else if (path.isExportDefaultDeclaration()) {
        let exportName;
        const declarationPath = path.get("declaration");
        if (declarationPath.isAssignmentExpression()) {
          exportName = declarationPath.get("left").toString();
        } else {
          exportName = declarationPath.toString();
        }
        dependencyGrapthNode.exports.push({
          type: EXPORT_TYPE.default,
          exported: exportName,
        });
      } else {
        dependencyGrapthNode.exports.push({
          type: EXPORT_TYPE.all,
          exported: path.get("exported").node.name,
          source: path.get("source").node.value,
        });
      }
    },
  });
  allModules[curModulePath] = dependencyGrapthNode;
}

module.exports = function (curModulePath) {
  const dependencyGraph = {
    root: new DependencyNode(),
    allModules: {},
  };
  traverseJsModule(
    curModulePath,
    dependencyGraph.root,
    dependencyGraph.allModules
  );
  return dependencyGraph;
};
