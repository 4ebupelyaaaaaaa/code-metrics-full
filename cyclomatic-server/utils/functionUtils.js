// utils/functionUtils.js

const FUNCTION_NODES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
  "ClassMethod",
  "ObjectMethod",
]);

function unwrapTS(path) {
  let p = path;
  while (
    p.parentPath &&
    (p.parentPath.isTSAsExpression() ||
      p.parentPath.isTSTypeAssertion() ||
      p.parentPath.isTSNonNullExpression())
  ) {
    p = p.parentPath;
  }
  return p;
}

function getFunctionName(path) {
  const { node } = path;

  if (node.id?.name) {
    return node.id.name;
  }

  if (path.isArrowFunctionExpression() || path.isFunctionExpression()) {
    const vp = unwrapTS(path);

    if (
      vp.parentPath.isVariableDeclarator() &&
      vp.parentPath.node.id.type === "Identifier"
    ) {
      return vp.parentPath.node.id.name;
    }

    if (
      vp.parentPath.isCallExpression() &&
      vp.parentPath.parentPath?.isVariableDeclarator() &&
      vp.parentPath.parentPath.node.id.type === "Identifier"
    ) {
      return vp.parentPath.parentPath.node.id.name;
    }
  }

  if (
    path.parentPath.isAssignmentExpression() &&
    path.parentPath.node.left.type === "Identifier"
  ) {
    return path.parentPath.node.left.name;
  }

  if ((path.isClassMethod() || path.isObjectMethod()) && node.key?.name) {
    return node.key.name;
  }

  return "<anonymous>";
}

module.exports = { getFunctionName, FUNCTION_NODES };
