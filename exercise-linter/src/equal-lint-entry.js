const { transformFromAstSync } = require("@babel/core");
const parser = require("@babel/parser");
const equalLintPlugin = require("./plugin/equal-lint");

const sourceCode = `
a == b
foo == true
bananas != 1
value == undefined
typeof foo == 'undefined'
'hello' != 'world'
0 == 0
true == true
`;

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  comments: true,
});

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      equalLintPlugin,
      {
        fix: true,
      },
    ],
  ],
  comments: true,
});

console.log(code);
