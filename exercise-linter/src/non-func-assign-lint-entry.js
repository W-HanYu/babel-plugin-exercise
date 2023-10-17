const { transformFromAstSync } = require("@babel/core");
const parser = require("@babel/parser");
const nonFuncAssignLintPlugin = require("./plugin/non-func-assign-lint");

const sourceCode = `
  function foo(){
    foo = bar
  }

  let h = function hello(){
  hello = 'abc'
  }
`;

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
});

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [nonFuncAssignLintPlugin],
  filename: "input.js",
});
