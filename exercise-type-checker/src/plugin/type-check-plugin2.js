const { declare } = require("@babel/helper-plugin-utils");

function resolveType(targetType) {
  const tsTypeAnnotationMap = {
    TSStringKeyword: "string",
  };

  switch (targetType.type) {
    case "TSTypeAnnotation":
      return tsTypeAnnotationMap[targetType.typeAnnotation.type];
    case "NumberTypeAnnotation":
      return "number";
  }
}

function noStackTracerWrapper(cb) {
  const tem = Error.stackTraceLimit;
  Error.stackTraceLimit = 0;
  cb && cb(Error);
  Error.stackTraceLimit = tem;
}

const noFuncAssignLintPLugin = declare((api, options, dirname) => {
  api.assertVersion(7);

  return {
    pre(file) {
      file.set("errors", []);
    },
    visitor: {
      VariableDeclarator(path, state) {
        const errors = state.file.get("errors");
        const idType = resolveType(path.get("id").getTypeAnnotation());
        const initType = resolveType(path.get("init").getTypeAnnotation());
        if (idType !== initType) {
          noStackTracerWrapper((Error) => {
            errors.push(
              path
                .get("init")
                .buildCodeFrameError(
                  `${initType} can not assign to ${idType}`,
                  Error
                )
            );
          });
        }
      },
    },
    post(file) {
      console.log(file.get("errors"));
    },
  };
});

module.exports = noFuncAssignLintPLugin;
