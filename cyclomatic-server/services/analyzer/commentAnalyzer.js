// Порог  ниже которого считаем «низкий уровень комментариев»
const COMMENT_THRESHOLD = 10;

function analyzeComments(files) {
  const results = [];

  for (const { name, code } of files) {
    const lines = code.split("\n");
    let commentLines = 0;

    let inBlockComment = false;

    for (let line of lines) {
      const trimmed = line.trim();

      if (trimmed.startsWith("#")) {
        commentLines++;
        continue;
      }

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
