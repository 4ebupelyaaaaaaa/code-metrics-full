// services/analyzer/codeAnalyzer.js
const path = require("path");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { getFunctionName } = require("../../utils/functionUtils"); // импортируем утилиту

const CC_THRESHOLD = 1;

function computeCyclomatic(bodyPath) {
  let count = 1;
  bodyPath.traverse({
    IfStatement() {
      count++;
    },
    ForStatement() {
      count++;
    },
    ForInStatement() {
      count++;
    },
    ForOfStatement() {
      count++;
    },
    WhileStatement() {
      count++;
    },
    DoWhileStatement() {
      count++;
    },
    CatchClause() {
      count++;
    },
    ConditionalExpression() {
      count++;
    },
    LogicalExpression(path) {
      if (path.node.operator === "&&" || path.node.operator === "||") count++;
    },
    SwitchCase(path) {
      if (path.node.test) count++;
    },
  });
  return count;
}

function safeParse(source, filename) {
  const ext = path.extname(filename).toLowerCase();
  const plugins = [
    "classProperties",
    "classPrivateProperties",
    "decorators-legacy",
    "dynamicImport",
    "optionalChaining",
    "nullishCoalescingOperator",
    "objectRestSpread",
    "topLevelAwait",
  ];
  if (ext === ".ts" || ext === ".tsx") plugins.unshift("typescript");
  if (ext === ".jsx" || ext === ".tsx") plugins.push("jsx");
  try {
    return parser.parse(source, { sourceType: "module", plugins });
  } catch (err) {
    console.warn(`⛔ Парсинг ${filename} не удался: ${err.message}`);
    return null;
  }
}

function analyzeCode(source, filename) {
  const ast = safeParse(source, filename);
  if (!ast) return [];
  const results = [];
  traverse(ast, {
    Function(path) {
      const name = getFunctionName(path); // получаем имя через утилиту
      const cc = computeCyclomatic(path.get("body"));
      if (cc > CC_THRESHOLD)
        results.push({ name, cyclomaticComplexity: cc, file: filename });
    },
  });
  return results;
}

module.exports = { analyzeCode };
