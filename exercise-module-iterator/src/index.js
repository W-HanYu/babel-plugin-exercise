const traverseModule = require("./traverseModule");
const fs = require("fs");
const path = require("path");
const dependencyGraph = traverseModule(
  path.resolve(__dirname, "../test-project/index.js")
);

const filePath = path.resolve(__dirname, "../outputPublic/moduleGraph.json");
const data = JSON.stringify(dependencyGraph, null, 4);

fs.writeFile(filePath, data, (err) => {
  if (err) {
    console.error("Error writing file:", err);
  } else {
    console.log("File written successfully.");
  }
});
console.log(JSON.stringify(dependencyGraph, null, 4));
