const { declare } = require("@babel/helper-plugin-utils");

const equalLint = declare((api, options, dirname) => {
  api.assertVersion(7);

  return {
    pre(file) {
      file.set("errors", []);
    },
    visitor: {
      BinaryExpression(path, state) {
        const errors = state.file.get("errors");
        if (["==", "!="].includes(path.node.operator)) {
          const left = path.get("left");
          const right = path.get("right");
          if (
            !(
              left.isLiteral() &&
              right.isLiteral() &&
              typeof left.node.value === typeof right.node.value
            )
          ) {
            const tem = Error.stackTraceLimit;
            Error.stackTraceLimit = 0;
            errors.push(
              path.buildCodeFrameError(
                `please replace ${path.node.operator} with ${
                  path.node.operator + "="
                }`,
                Error
              )
            );

            Error.stackTraceLimit = tem;
            if (state.opts.fix) {
              path.node.operator = path.node.operator + "=";
            }
          }
        }
      },
    },
    post(file) {
      console.log(file.get("errors"));
    },
  };
});

module.exports = equalLint;
