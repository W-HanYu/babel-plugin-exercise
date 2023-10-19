const parser = require("@babel/parser");
const { codeFrameColumns } = require("@babel/code-frame");
const chalk = require("chalk");

const sourceCode = `
  const a = 2 ** 3
  console.log(a)
`;

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
});

/**
 * 定义作用域类
 * Scope 类用于存储变量声明和查找变量的值。每个作用域都可以有一个父作用域，形成作用域链。
 */
class Scope {
  constructor(parentScope) {
    this.parent = parentScope;
    this.declarations = [];
  }
  set(name, value) {
    this.declarations[name] = value;
  }

  getGlobal(name) {
    return this.declarations[name];
  }
  get(name) {
    let res = this.getGlobal(name);
    if (res === undefined && this.parent) {
      res = this.parent.get(name);
    }
    return res;
  }

  has(name) {
    return !!this.getGlobal(name);
  }
}

const evaluator = (function () {
  /**
   * AST 解释器
   */
  const astInterpreters = {
    Program(node, scope) {
      node.body.forEach((item) => {
        evaluate(item, scope);
      });
    },
    VariableDeclaration(node, scope) {
      node.declarations.forEach((item) => {
        evaluate(item, scope);
      });
    },

    VariableDeclarator(node, scope) {
      const declareName = evaluate(node.id);
      if (scope.get(declareName)) {
        throw Error("duplicate declare variable：" + declareName);
      } else {
        scope.set(declareName, evaluate(node.init, scope));
      }
    },
    ExpressionStatement(node, scope) {
      return evaluate(node.expression, scope);
    },
    MemberExpression(node, scope) {
      const obj = scope.get(evaluate(node.object));
      return obj[evaluate(node.property)];
    },
    CallExpression(node, scope) {
      const fn = evaluate(node.callee, scope);
      const args = node.arguments.map((item) => {
        if (item.type === "Identifier") {
          return scope.get(item.name);
        }
        return evaluate(item, scope);
      });
      if (node.callee.type === "MemberExpression") {
        const obj = evaluate(node.callee.object, scope);
        return fn.apply(obj, args);
      } else {
        return fn.apply(null, args);
      }
    },
    BinaryExpression(node, scope) {
      const leftValue = evaluate(node.left, scope);
      const rightValue = evaluate(node.right, scope);
      switch (node.operator) {
        case "+":
          return leftValue + rightValue;
        case "-":
          return leftValue - rightValue;
        case "*":
          return leftValue * rightValue;
        case "**":
          return Math.pow(leftValue,rightValue)
        case "/":
          return leftValue / rightValue;
        default:
          throw new Error("upsupported operator：" + node.operator);
      }
    },
    Identifier(node, scope) {
      return node.name;
    },
    NumericLiteral(node, scope) {
      return node.value;
    },
  };

  const evaluate = function (node, scope) {
    try {
      return astInterpreters[node.type](node, scope);
    } catch (e) {
      if (
        e &&
        e.message &&
        e.message.indexOf("astInterpreters[node.type] is not a function") !== -1
      ) {
        console.error("unsupported ast type" + node.type);
        console.error(
          codeFrameColumns(sourceCode, node.loc, {
            highlightCode: true,
          })
        );
      } else {
        console.error(node.type + ":", e.message);
        console.error(
          codeFrameColumns(sourceCode, node.loc, {
            highlightCode: true,
          })
        );
      }
    }
  };

  return {
    evaluate,
  };
})();

const globalScope = new Scope();

globalScope.set("console", {
  log(...args) {
    console.log(chalk.green(...args));
  },
  error(...args) {
    console.error(chalk.red(...args));
  },
  warn: function (...args) {
    console.log(chalk.orange(...args));
  },
});

evaluator.evaluate(ast.program, globalScope);
