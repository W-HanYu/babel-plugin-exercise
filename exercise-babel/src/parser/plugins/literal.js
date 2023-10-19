module.exports = function (Parser) {
  return class extends Parser {
    parserLiteral(...args) {
      const node = super.parserLiteral(...args);
      switch (typeof node.value) {
        case "number":
          node.type = "NumericLiteral";
          break;
        case "string":
          node.type = "StringLiteral";
          break;
      }

      return node;
    }
  };
};
