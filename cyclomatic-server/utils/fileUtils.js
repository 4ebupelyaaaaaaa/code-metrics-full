// utils/fileUtils.js
const fs = require("fs");
const path = require("path");
const unzipper = require("unzipper");

const ALLOWED_EXT = [".js", ".jsx", ".ts", ".tsx", ".py"];
const EXCL_DIRS = ["node_modules", ".git", "__pycache__"];
const EXCL_FILES = [
  ".DS_Store",
  "package.json",
  "tsconfig.json",
  "jsconfig.json",
  ".gitignore",
  ".eslintrc",
  ".prettierrc",
];

async function extractFilesFromArchive(filePath) {
  const files = [];
  try {
    const dir = await unzipper.Open.file(filePath);
    for (const entry of dir.files) {
      const ext = path.extname(entry.path).toLowerCase();
      const base = path.basename(entry.path);
      if (
        entry.type !== "File" ||
        !ALLOWED_EXT.includes(ext) ||
        EXCL_DIRS.some((d) => entry.path.includes(`${d}/`)) ||
        EXCL_FILES.includes(base)
      )
        continue;
      const buf = await entry.buffer();
      files.push({ name: entry.path, code: buf.toString("utf8") });
    }
  } catch (err) {
    throw new Error(`Ошибка при извлечении файлов из архива: ${err.message}`);
  }
  return files;
}

function readFile(filePath) {
  try {
    const code = fs.readFileSync(filePath, "utf8");
    return [{ name: path.basename(filePath), code }];
  } catch (err) {
    throw new Error(`Ошибка при чтении файла ${filePath}: ${err.message}`);
  }
}

module.exports = { extractFilesFromArchive, readFile };
