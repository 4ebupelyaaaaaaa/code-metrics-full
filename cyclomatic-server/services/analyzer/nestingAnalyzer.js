// services/analyzer/duplicationAnalyzer.js

/**
 * Подсчитывает дублирование строк в наборе файлов,
 * игнорируя служебные конструкции, теги, комментарии и пунктуацию.
 *
 * @param {Array<{ name: string, code: string }>} files
 * @returns {{
 *   totalLines: number,
 *   duplicatedLines: number,
 *   duplicationPercentage: number,
 *   duplicates: Array<{ line: string, count: number, files: string[] }>
 * }}
 */
function analyzeDuplication(files) {
  const lineMap = new Map(); // Map<normalizedLine, { count, files: Set }>
  let totalLines = 0;

  // Регэкспы для фильтрации
  const importExportRE = /^\s*(import|export)\b/;
  const commentLineRE = /^\s*(\/\/.*|\/\*[\s\S]*\*\/)\s*$/;
  const inlineCommentRE = /\/\/.*$|\/\*[\s\S]*?\*\/\s*$/;
  const keywordRE =
    /\b(if|else|for|while|switch|catch|try|do|case|default|return)\b/;
  const htmlTagFullRE = /^\s*<\/?[A-Za-z][^>]*>\s*$/;
  const htmlTagOpenOnlyRE = /^\s*<[^>]+$/; // начинающийся с '<' без '>'
  const htmlTagCloseOnlyRE = /^\s*[^<]+>\s*$/; // заканчивающийся на '>' без '<' в начале
  const spreadRE = /^\s*\.\.\.\w+,?\s*$/;

  // Символы-пунктуация, без букв/цифр, после удаления всех пробелов
  const onlyPunctRE =
    /^[\)\]\}\{\>\;<\,\=\-\+\/\|\:\?\`\~\!\@\#\$\%\^\&\*\[\]\(\)]+$/;

  for (const { name, code } of files) {
    for (let rawLine of code.split(/\r?\n/)) {
      // 1) Убираем инлайн-комментарий, 2) обрезаем пробелы
      const withoutInline = rawLine.replace(inlineCommentRE, "");
      const line = withoutInline.trim();

      // Сначала грубые пропуски:
      if (
        !line || // пустая после trim
        commentLineRE.test(rawLine) || // чистый комментарий
        importExportRE.test(line) || // import/export
        htmlTagFullRE.test(line) || // <Tag> </Tag> <Tag/>
        htmlTagOpenOnlyRE.test(rawLine) || // неполный открывающий '<div'
        htmlTagCloseOnlyRE.test(rawLine) ||
        spreadRE.test(line)
      ) {
        continue;
      }

      if (keywordRE.test(line)) {
        continue;
      }

      const noSpaces = line.replace(/\s+/g, "");
      if (onlyPunctRE.test(noSpaces)) {
        continue;
      }

      totalLines++;
      const entry = lineMap.get(line) || { count: 0, files: new Set() };
      entry.count++;
      entry.files.add(name);
      lineMap.set(line, entry);
    }
  }

  let duplicatedLines = 0;
  const duplicates = [];

  for (const [line, { count, files }] of lineMap.entries()) {
    if (count > 1) {
      duplicatedLines += count - 1;
      duplicates.push({
        line,
        count,
        files: Array.from(files),
      });
    }
  }

  const duplicationPercentage =
    totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0;

  return {
    totalLines,
    duplicatedLines,
    duplicationPercentage,
    duplicates,
  };
}

module.exports = { analyzeDuplication };
