const astDefinitionMap = new Map();

astDefinitionMap.set("Program", {
  visitor: ["body"],
  isBlock: true,
});

astDefinitionMap.set("VariableDeclaration", {
  visitor: ["declarations"],
});

astDefinitionMap.set("VariableDeclarator", {
  visitor: ["id", "init"],
});
astDefinitionMap.set("Identifier", {});
astDefinitionMap.set("NumericLiteral", {});
astDefinitionMap.set("StringLiteral", {});
astDefinitionMap.set("FunctionDeclaration", {
  visitor: ["id", "params", "body"],
  isBlock: true,
});
astDefinitionMap.set("BlockStatement", {
  visitor: ["body"],
});
astDefinitionMap.set("ReturnStatement", {
  visitor: ["argument"],
});
astDefinitionMap.set("BinaryExpression", {
  visitor: ["left", "right"],
});
astDefinitionMap.set("ExpressionStatement", {
  visitor: ["expression"],
});
astDefinitionMap.set("CallExpression", {
  visitor: ["callee", "arguments"],
});

const validations = {};
for (let name of astDefinitionMap.keys()) {
  validations["is" + name] = function (node) {
    return node.type === name;
  };
}

module.exports = {
  visitorKeys: astDefinitionMap,
  ...validations,
};
