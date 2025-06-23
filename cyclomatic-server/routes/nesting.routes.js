// routes/duplication.routes.js
const express = require("express");
const multer = require("multer");
const unzipper = require("unzipper");
const fs = require("fs");
const path = require("path");
const { analyzeDuplication } = require("../services/analyzer/nestingAnalyzer");
const { savePdf } = require("../services/pdfGenerator");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "../tmp")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

router.post("/duplication", upload.single("archive"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error:
        "Нет загруженного файла: убедитесь, что в form-data есть поле 'archive' типа File",
    });
  }

  // Разбираем опции: какие поля вернуть
  let optionsObj;
  try {
    optionsObj = JSON.parse(req.body.options || "{}");
  } catch {
    return res
      .status(400)
      .json({ success: false, error: "options должен быть валидным JSON" });
  }
  const { reports = [] } = optionsObj;
  if (!Array.isArray(reports)) {
    return res.status(400).json({
      success: false,
      error: "options.reports должен быть массивом строк",
    });
  }

  const tmpPath = req.file.path;
  try {
    // 1. Собираем файлы
    const files = [];
    const orig = req.file.originalname.toLowerCase();
    if (orig.endsWith(".zip")) {
      const dir = await unzipper.Open.file(tmpPath);
      for (const entry of dir.files) {
        if (!/\.(js|ts|tsx|jsx)$/.test(entry.path)) continue;
        const buf = await entry.buffer();
        files.push({ name: entry.path, code: buf.toString("utf8") });
      }
    } else {
      const code = fs.readFileSync(tmpPath, "utf8");
      files.push({ name: req.file.originalname, code });
    }

    // 2. Анализ дублирования
    const { duplicatedLines, duplicationPercentage, duplicates } =
      analyzeDuplication(files);

    // 3. Берём топ-25 дубликатов по количеству
    const topDuplicates = duplicates
      .sort((a, b) => b.count - a.count)
      .slice(0, 25);

    // 4. Генерируем PDF
    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfName = `${Date.now()}-duplication-report.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);

    await savePdf(pdfPath, {
      title: "Отчёт по дублированию кода",
      avg: duplicationPercentage,
      top5: topDuplicates,
      chartData: [], // нет графика
    });

    // 5. Формируем ответ только с нужными полями
    const response = { success: true, pdfUrl: `/static/reports/${pdfName}` };

    if (reports.includes("duplicatedLines")) {
      response.duplicatedLines = duplicatedLines;
    }
    if (reports.includes("duplicationPercentage")) {
      response.duplicationPercentage = Number(duplicationPercentage.toFixed(2));
    }
    if (reports.includes("topDuplicates")) {
      response.topDuplicates = topDuplicates;
    }

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    fs.unlink(tmpPath, () => {});
  }
});

module.exports = router;
