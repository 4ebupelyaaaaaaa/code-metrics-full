const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

// Проверка на camelCase (упрощённая)
function isCamelCase(name) {
  return /^[a-z][a-zA-Z0-9]*$/.test(name);
}

// Подсчёт доли строк <= 80 символов
function calcLineLengthRatio(code, maxLen = 80) {
  const lines = code.split("\n");
  const ok = lines.filter((l) => l.length <= maxLen).length;
  return lines.length ? ok / lines.length : 0;
}

// Подсчёт средней глубины вложенности
function calcAvgDepth(ast) {
  let totalDepth = 0;
  let nodeCount = 0;
  let maxDepth = 0;

  function walk(node, depth = 0) {
    maxDepth = Math.max(maxDepth, depth);
    nodeCount++;
    totalDepth += depth;

    for (const key in node) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach((c) => {
          if (c && typeof c.type === "string") walk(c, depth + 1);
        });
      } else if (child && typeof child.type === "string") {
        walk(child, depth + 1);
      }
    }
  }

  walk(ast);
  return {
    avg: nodeCount ? totalDepth / nodeCount : 0,
    max: maxDepth,
  };
}

// Подсчёт доли camelCase идентификаторов
function calcNamingRatio(ast) {
  let total = 0;
  let camel = 0;
  traverse(ast, {
    Identifier(path) {
      total++;
      if (isCamelCase(path.node.name)) camel++;
    },
  });
  return total ? camel / total : 0;
}

// Основная функция
function analyzeReadability(files) {
  return files.map(({ name, code }) => {
    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: "unambiguous",
        plugins: ["jsx", "typescript"],
      });
    } catch {
      return { file: name, score: 0 };
    }

    const lineRatio = calcLineLengthRatio(code); // L
    const { avg: avgDepth } = calcAvgDepth(ast); // D
    const maxAllowedDepth = 5;
    const depthScore = 1 - Math.min(avgDepth / maxAllowedDepth, 1); // нормировано

    const commentLines = (code.match(/\/\/|\/\*|\*\//g) || []).length;
    const totalLines = code.split("\n").length;
    const commentRatio = totalLines ? commentLines / totalLines : 0; // C

    const namingRatio = calcNamingRatio(ast); // N

    // итоговый score
    const score =
      100 *
      (0.3 * lineRatio +
        0.3 * depthScore +
        0.3 * commentRatio +
        0.1 * namingRatio);

    return {
      file: name,
      score: Math.round(score * 100) / 100, // округлим до 2 знаков
    };
  });
}

module.exports = { analyzeReadability };
