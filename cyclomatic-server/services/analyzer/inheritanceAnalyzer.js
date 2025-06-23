const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { getFunctionName } = require("../../utils/functionUtils"); // Импортируем утилиту

// Узлы «класс»
const CLASS_NODES = new Set(["ClassDeclaration", "ClassExpression"]);

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

function getSuperName(node) {
  if (!node) return null;
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") {
    const obj = node.object.type === "Identifier" ? node.object.name : null;
    const prop =
      node.property.type === "Identifier" ? node.property.name : null;
    if (obj && prop) {
      return `${obj}.${prop}`;
    }
  }
  return null;
}

function safeParse(code) {
  return parser.parse(code, {
    sourceType: "module",
    plugins: [
      "decorators-legacy", // декораторы
      "classProperties", // публичные поля
      "classPrivateProperties", // приватные поля
      "typescript", // TS-синтаксис
      "jsx", // JSX
      "optionalChaining", // ?.
      "nullishCoalescingOperator", // ??.
      "numericSeparator", // 1_000
      "topLevelAwait", // await на верхнем уровне
    ],
  });
}

function analyzeInheritance(files) {
  // 1. Собираем глобальную карту всех классов
  const globalClassMap = new Map();

  for (const { code } of files) {
    let ast;
    try {
      ast = safeParse(code);
    } catch {
      continue; // пропускаем «сложные» файлы
    }
    traverse(ast, {
      enter(path) {
        if (!CLASS_NODES.has(path.node.type)) return;
        const cname = getFunctionName(path); // Используем getFunctionName для получения имени класса
        globalClassMap.set(cname, path.node);
      },
    });
  }

  // 2. Для каждого файла считаем глубину
  const results = [];
  for (const { name, code } of files) {
    let ast;
    try {
      ast = safeParse(code);
    } catch {
      results.push({ file: name, maxDepth: 0, classes: [] });
      continue;
    }

    const localClasses = [];
    traverse(ast, {
      enter(path) {
        if (!CLASS_NODES.has(path.node.type)) return;
        localClasses.push({ name: getFunctionName(path), node: path.node }); // Используем getFunctionName
      },
    });

    const classesWithDepth = localClasses.map(({ name: cname, node }) => {
      let depth = 0;
      let sc = node.superClass;
      while (sc) {
        const superName = getSuperName(sc);
        if (!superName) break;
        depth++;
        if (globalClassMap.has(superName)) {
          sc = globalClassMap.get(superName).superClass;
        } else {
          break; // внешний — React.Component, etc.
        }
      }
      return { name: cname, depth };
    });

    const maxDepth = classesWithDepth.reduce((m, c) => Math.max(m, c.depth), 0);
    results.push({ file: name, maxDepth, classes: classesWithDepth });
  }

  return results;
}

module.exports = { analyzeInheritance };

