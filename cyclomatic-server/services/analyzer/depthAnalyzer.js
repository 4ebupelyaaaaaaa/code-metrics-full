// services/analyzer/depthAnalyzer.js
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const {
  getFunctionName,
  FUNCTION_NODES,
} = require("../../utils/functionUtils");

function analyzeDepth(files) {
  const results = [];

  for (const { name, code } of files) {
    const ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
    });

    const funcs = [];

    traverse(ast, {
      enter(path) {
        if (
          (path.isArrowFunctionExpression() || path.isFunctionExpression()) &&
          path.parentPath.isCallExpression() &&
          !path.parentPath.parentPath?.isVariableDeclarator()
        ) {
          return path.skip();
        }

        if (!FUNCTION_NODES.has(path.node.type)) return;

        const fname = getFunctionName(path);

        let depth = 0,
          maxDepth = 0;

        path.traverse({
          enter(inner) {
            if (FUNCTION_NODES.has(inner.node.type) && inner !== path) {
              return inner.skip();
            }
            if (
              inner.isBlockStatement() ||
              inner.isIfStatement() ||
              inner.isForStatement() ||
              inner.isWhileStatement() ||
              inner.isSwitchStatement() ||
              inner.isTryStatement() ||
              inner.isConditionalExpression()
            ) {
              depth++;
              if (depth > maxDepth) maxDepth = depth;
            }
          },
          exit(inner) {
            if (
              inner.isBlockStatement() ||
              inner.isIfStatement() ||
              inner.isForStatement() ||
              inner.isWhileStatement() ||
              inner.isSwitchStatement() ||
              inner.isTryStatement() ||
              inner.isConditionalExpression()
            ) {
              depth--;
            }
          },
        });

        funcs.push({ name: fname, depth: maxDepth, file: name }); // добавляем поле file
      },
    });

    const fileMax = funcs.reduce((m, f) => Math.max(m, f.depth), 0);
    results.push({ file: name, maxDepth: fileMax, functions: funcs });
  }

  return results;
}

module.exports = { analyzeDepth };


