const acorn = require("acorn");

const Parser = acorn.Parser;
const tt = acorn.tokTypes;
const TokenType = acorn.TokenType;

Parser.acorn.keywordTypes["tao"] = new TokenType("tao", {
  keyword: "tao",
});

module.exports = function (Parser) {
  return class extends Parser {
    parse(program) {
      let newKeywords =
        "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this const class extends export import super";
      newKeywords += " tao";
      this.keywords = new RegExp(
        "^(?:" + newKeywords.replace(/ /g, "|") + ")$"
      );
      return super.parse(program);
    }

    parseStatement(context, topLevel, exports) {
      var starttype = this.type;

      if (starttype == Parser.acorn.keywordTypes["tao"]) {
        var node = this.startNode();
        return this.parseTaoStatement(node);
      } else {
        return super.parseStatement(context, topLevel, exports);
      }
    }

    parseTaoStatement(node) {
      this.next();
      return this.finishNode({ value: "tao" }, "taoStatement"); //新增加的ssh语句
    }
  };
};
