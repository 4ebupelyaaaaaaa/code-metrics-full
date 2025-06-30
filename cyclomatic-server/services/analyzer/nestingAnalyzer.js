function analyzeDuplication(files) {
  const lineMap = new Map();
  let totalLines = 0;

  const importExportRE = /^\s*(import|export)\b/;
  const commentLineRE = /^\s*(\/\/.*|\/\*[\s\S]*\*\/)\s*$/;
  const inlineCommentRE = /\/\/.*$|\/\*[\s\S]*?\*\/\s*$/;
  const keywordRE =
    /\b(if|else|for|while|switch|catch|try|do|case|default|return)\b/;
  const htmlTagFullRE = /^\s*<\/?[A-Za-z][^>]*>\s*$/;
  const htmlTagOpenOnlyRE = /^\s*<[^>]+$/;
  const htmlTagCloseOnlyRE = /^\s*[^<]+>\s*$/;
  const spreadRE = /^\s*\.\.\.\w+,?\s*$/;

  const onlyPunctRE =
    /^[\)\]\}\{\>\;<\,\=\-\+\/\|\:\?\`\~\!\@\#\$\%\^\&\*\[\]\(\)]+$/;

  for (const { name, code } of files) {
    for (let rawLine of code.split(/\r?\n/)) {
      const withoutInline = rawLine.replace(inlineCommentRE, "");
      const line = withoutInline.trim();

      if (
        !line ||
        commentLineRE.test(rawLine) ||
        importExportRE.test(line) ||
        htmlTagFullRE.test(line) ||
        htmlTagOpenOnlyRE.test(rawLine) ||
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
