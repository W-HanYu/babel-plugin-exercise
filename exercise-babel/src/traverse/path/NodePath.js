const types = require("../../types");
const generate = require("../../generator");

class NodePath {
  /**
   * @param {*} key 属性
   * @param {*} listKey  若为数组，则 listKey 为数组下标； 若为对象，则 listKey 为空
   */
  constructor(node, parent, parentPath, key, listKey) {
    this.node = node;
    this.parent = parent;
    this.parentPath = parentPath;
    this.key = key;
    this.listKey = listKey;

    Object.keys(types).forEach((key) => {
      if (key.startsWith("is")) {
        this[key] = types[key].bind(this, node);
      }
    });
  }

  skip() {
    return (this.node.__shouldSkip = true);
  }

  isBlock() {
    return types.visitorKeys.get(this.node.type).isBlock;
  }
  /**
   * 替换节点
   */
  replaceWith(node) {
    if (this.listKey !== undefined) {
      this.parent[this.key].splice(this.listKey, 1, node);
    } else {
      this.parent[this.key] = node;
    }
  }

  remove() {
    if (this.listKey !== undefined) {
      this.parent[this.key].splice(this.listKey, 1);
    } else {
      this.parent[this.key] = null;
    }
  }

  findParent(callback) {
    let curPath = this;
    while ((curPath = curPath.parentPath)) {
      if (callback(curPath)) {
        return curPath;
      }
    }
    return null;
  }

  find(callback) {
    let curPath = this;
    do {
      if (callback(curPath)) {
        return curPath;
      }
    } while ((curPath = curPath.parentPath));
    return null;
  }

  traverse(visitors) {
    const traverse = require("../index");
    const definition = types.visitorKeys.get(this.node.type);
    if (definition.visitors) {
      definition.visitors.forEach((key) => {
        const prop = this.node[key];
        if (Array.isArray(prop)) {
          prop.forEach((childrenNode, index) => {
            traverse(childrenNode, visitors, this.node, this);
          });
        } else {
          traverse(prop, visitors, this.node, this);
        }
      });
    }
  }

  tiString() {
    return generate(this.node).code;
  }
}

module.exports = NodePath;
