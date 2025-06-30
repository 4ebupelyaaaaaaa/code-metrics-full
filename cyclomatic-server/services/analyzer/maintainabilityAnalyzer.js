const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const {
  getFunctionName,
  FUNCTION_NODES,
} = require("../../utils/functionUtils");

// Порог MI для «низкой ремонтопригодности»
const MI_THRESHOLD = 65;

const PARSER_PLUGINS = [
  "decorators-legacy",
  "classProperties",
  "classPrivateProperties",
  "typescript",
  "jsx",
  "optionalChaining",
  "nullishCoalescingOperator",
  "numericSeparator",
  "topLevelAwait",
];

function safeParse(code, fileName) {
  try {
    return parser.parse(code, {
      sourceType: "module",
      plugins: PARSER_PLUGINS,
    });
  } catch (e) {
    console.warn(
      `maintainabilityAnalyzer: не удалось распарсить ${fileName}: ${e.message}`
    );
    throw e;
  }
}

function analyzeMaintainability(files) {
  const results = [];

  for (const { name, code } of files) {
    let ast;
    try {
      ast = safeParse(code, name);
    } catch {
      continue;
    }

    const functionNames = [];
    traverse(ast, {
      enter(path) {
        if (FUNCTION_NODES.has(path.node.type)) {
          functionNames.push(getFunctionName(path));
        }
      },
    });

    let operators = [];
    let operands = [];
    let distinctOps = new Set();
    let distinctOprs = new Set();
    let cc = 1;
    const loc = code.split("\n").length;

    traverse(ast, {
      enter(path) {
        const t = path.node.type;
        // +1 за каждый  узел
        if (
          [
            "IfStatement",
            "ForStatement",
            "ForInStatement",
            "ForOfStatement",
            "WhileStatement",
            "DoWhileStatement",
            "SwitchCase",
            "ConditionalExpression",
            "LogicalExpression",
          ].includes(t)
        ) {
          cc++;
        }

        // Операторы
        if (
          path.isBinaryExpression() ||
          path.isLogicalExpression() ||
          path.isUnaryExpression() ||
          path.isUpdateExpression() ||
          path.isAssignmentExpression() ||
          path.isCallExpression() ||
          path.isConditionalExpression()
        ) {
          const op = path.node.operator || path.node.type;
          operators.push(op);
          distinctOps.add(op);
        }

        // Операнды
        if (path.isIdentifier()) {
          operands.push(path.node.name);
          distinctOprs.add(path.node.name);
        }
        if (path.isLiteral && typeof path.node.value !== "undefined") {
          const val = String(path.node.value);
          operands.push(val);
          distinctOprs.add(val);
        }
      },
    });

    const N = operators.length + operands.length;
    const n = distinctOps.size + distinctOprs.size;
    const HV = n > 0 ? N * Math.log2(n) : 0;
    // Формула MI
    let mi =
      ((171 - 5.2 * Math.log(HV || 1) - 0.23 * cc - 16.2 * Math.log(loc)) *
        100) /
      171;
    mi = Math.max(0, mi);

    results.push({
      file: name,
      mi: Number(mi.toFixed(2)),
      functionNames,
    });
  }

  return results;
}

module.exports = { analyzeMaintainability, MI_THRESHOLD };
