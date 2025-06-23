const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;
const { getFunctionName } = require("../../utils/functionUtils"); // Импортируем утилиту

// Порог (%) ниже которого считаем «низкий уровень комментариев»
const COMMENT_THRESHOLD = 10;

/**
 * Анализирует процент комментариев в каждом файле.
 * Возвращает массив:
 * [{ file, totalLines, commentLines, ratio }]
 */
function analyzeComments(files) {
  const results = [];

  for (const { name, code } of files) {
    const lines = code.split("\n");
    let commentLines = 0;

    // Флаги для многострочных комментариев
    let inBlockComment = false;

    for (let line of lines) {
      const trimmed = line.trim();

      // Python-style comments
      if (trimmed.startsWith("#")) {
        commentLines++;
        continue;
      }

      // JS/TS block comment start/end
      if (!inBlockComment && trimmed.startsWith("/*")) {
        commentLines++;
        if (!trimmed.endsWith("*/")) inBlockComment = true;
        continue;
      }
      if (inBlockComment) {
        commentLines++;
        if (trimmed.endsWith("*/")) inBlockComment = false;
        continue;
      }
      // JS/TS single-line comment
      if (trimmed.startsWith("//")) {
        commentLines++;
      }
    }

    const totalLines = lines.length;
    const ratio =
      totalLines > 0
        ? Number(((commentLines / totalLines) * 100).toFixed(2))
        : 0;

    results.push({ file: name, totalLines, commentLines, ratio });
  }

  return results;
}

module.exports = { analyzeComments, COMMENT_THRESHOLD };
