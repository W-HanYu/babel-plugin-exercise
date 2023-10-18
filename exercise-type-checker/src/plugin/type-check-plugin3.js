const { declare } = require("@babel/helper-plugin-utils");

function resolveType(targetType) {
  const tsTypeAnnotationMap = {
    TSStringKeyword: "string",
    TSNumberKeyword: "number",
  };
  switch (targetType.type) {
    case "TSTypeAnnotation":
      return tsTypeAnnotationMap[targetType.TSTypeAnnotation.type];
    case "TSNumberKeyword":
      return "number";
    case "TSStringKeyword":
      return "string";
    case "NumberTypeAnnotation":
      return "number";
    case "StringTypeAnnotation":
      return "string";
  }
}

function noStackTraceWrapper(cb) {
  const tmp = Error.stackTraceLimit;
  Error.stackTraceLimit = 0;
  cb && cb(Error);
  Error.stackTraceLimit = tmp;
}

const noFuncAssignLint = declare((api, options, dirname) => {
  api.assertVersion(7);

  return {
    pre(file) {
      file.set("errors", []);
    },
    visitor: {
      CallExpression(path, state) {
        const errors = state.file.get("errors");
        // 调用参数的类型
        const argumentsTypes = path.get("arguments").map((item) => {
          return resolveType(item.getTypeAnnotation());
        });
        const calleeName = path.get("callee").toString();
        // 根据 callee 查找函数声明
        const functionDeclarePath = path.scope.getBinding(calleeName).path;
        // 拿到声明时参数的类型

        const params = functionDeclarePath.get("params").map((item) => {
          return item.getTypeAnnotation();
        });

        const declareParamsTypes = params.map((item) => {
          return resolveType(item);
        });
        argumentsTypes.forEach((item, index) => {
          console.log(
            `item - ${item} : declareParamsTypes[index] - ${declareParamsTypes[index]}`
          );
          if (item !== declareParamsTypes[index]) {
            noStackTraceWrapper((Error) => {
              errors.push(
                path
                  .get("arguments." + index)
                  .buildCodeFrameError(
                    `${item} can not assign to ${declareParamsTypes[index]}`,
                    Error
                  )
              );
            });
          }
        });
      },
    },
    post(file) {
      console.log(file.get("errors"));
    },
  };
});

module.exports = noFuncAssignLint;
