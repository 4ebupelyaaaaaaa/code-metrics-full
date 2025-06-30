const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const {
  getFunctionName,
  FUNCTION_NODES,
} = require("../../utils/functionUtils");

// Узлы, которые добавляют к когнитивной сложности
const COGNITIVE_NODES = new Set([
  "IfStatement",
  "ForStatement",
  "WhileStatement",
  "DoWhileStatement",
  "SwitchCase",
  "ConditionalExpression",
  "LogicalExpression",
  "CatchClause",
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

function analyzeCognitive(files) {
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

        let complexity = 0;
        let nesting = 0;

        path.traverse({
          enter(inner) {
            const t = inner.node.type;
            if (FUNCTION_NODES.has(t) && inner !== path) {
              return inner.skip();
            }
            if (COGNITIVE_NODES.has(t)) {
              complexity += 1 + nesting;
            }
            if (
              inner.isBlockStatement() ||
              inner.isIfStatement() ||
              inner.isForStatement() ||
              inner.isWhileStatement() ||
              inner.isDoWhileStatement() ||
              inner.isSwitchStatement() ||
              inner.isTryStatement()
            ) {
              nesting++;
            }
          },
          exit(inner) {
            if (
              inner.isBlockStatement() ||
              inner.isIfStatement() ||
              inner.isForStatement() ||
              inner.isWhileStatement() ||
              inner.isDoWhileStatement() ||
              inner.isSwitchStatement() ||
              inner.isTryStatement()
            ) {
              nesting--;
            }
          },
        });

        funcs.push({ name: fname, complexity: complexity + 1 });
      },
    });

    const avg =
      funcs.reduce((sum, f) => sum + f.complexity, 0) / (funcs.length || 1);

    results.push({
      file: name,
      avgComplexity: Number(avg.toFixed(2)),
      functions: funcs,
    });
  }

  return results;
}

module.exports = { analyzeCognitive };
