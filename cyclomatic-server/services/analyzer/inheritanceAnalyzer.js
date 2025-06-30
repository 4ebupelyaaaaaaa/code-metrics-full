const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { getFunctionName } = require("../../utils/functionUtils");

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
      "decorators-legacy",
      "classProperties",
      "classPrivateProperties",
      "typescript",
      "jsx",
      "optionalChaining",
      "nullishCoalescingOperator",
      "numericSeparator",
      "topLevelAwait",
    ],
  });
}

function analyzeInheritance(files) {
  const globalClassMap = new Map();

  for (const { code } of files) {
    let ast;
    try {
      ast = safeParse(code);
    } catch {
      continue;
    }
    traverse(ast, {
      enter(path) {
        if (!CLASS_NODES.has(path.node.type)) return;
        const cname = getFunctionName(path);
        globalClassMap.set(cname, path.node);
      },
    });
  }

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
        localClasses.push({ name: getFunctionName(path), node: path.node });
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
          break;
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
