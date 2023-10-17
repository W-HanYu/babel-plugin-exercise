const acorn = require("acorn")
const taoKeywordPlugin = require("./taoKeyWordPlugin")

const Parser = acorn.Parser
const newParser = Parser.extend(taoKeywordPlugin)

var program = `
    tao
    const a = 1
`;

const ast = newParser.parse(program);
console.log(ast);


