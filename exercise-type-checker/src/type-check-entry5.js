const { transformFromAstSync } = require("@babel/core");
const parser = require("@babel/parser");

const typeCheckPlugin5 = require("./plugin/type-check-plugin5");

const sourceCode = `
  type Res<params> = params extends 1 ? number : string
  function add<T>(a:Number,b:number){
    return a + b
  }
  add<Res<1>>(1,'2')
`;

const ast = parser.parse(sourceCode, {
  sourceType: "unambiguous",
  plugins: ["typescript"],
});

const { code } = transformFromAstSync(ast, sourceCode, {
  plugins: [
    [
      typeCheckPlugin5,
      {
        fix: true,
      },
    ],
  ],
  comments: true,
});

console.log(code);
