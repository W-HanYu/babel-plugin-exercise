const { transformFromAstSync } = require("@babel/core");
const parser = require("@babel/parser");
const typeCheckPlugin2 = require("./plugin/type-check-plugin2");

const sourceCode = `
  let name:string = 1
`;

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["typescript"],
});

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      typeCheckPlugin2,
      {
        fix: true,
      },
    ],
  ],
  comments: true,
});
console.log(code);
