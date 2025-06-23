// routes/comments.routes.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { extractFilesFromArchive, readFile } = require("../utils/fileUtils");
const { analyzeComments } = require("../services/analyzer/commentAnalyzer");
const { savePdf } = require("../services/pdfGenerator");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "../tmp")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

router.post("/comments", upload.single("archive"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Нет поля archive" });
  }

  // Разбираем опции: список ключей, которые нужно вернуть
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
    // 1. Извлекаем или читаем файлы
    const orig = req.file.originalname.toLowerCase();
    const files = orig.endsWith(".zip")
      ? await extractFilesFromArchive(tmpPath)
      : readFile(tmpPath);

    // 2. Анализ комментариев
    const results = analyzeComments(files);
    const totalLines = results.reduce((sum, r) => sum + r.totalLines, 0);
    const totalComments = results.reduce((sum, r) => sum + r.commentLines, 0);
    const commentRatio =
      totalLines > 0
        ? Number(((totalComments / totalLines) * 100).toFixed(2))
        : 0;

    // 3. Топ-5 файлов с наименьшим уровнем комментариев
    const top5Comment = results
      .slice()
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 5)
      .map((r) => ({ file: r.file, ratio: r.ratio }));

    // 4. ChartData — распределение по диапазонам
    const buckets = results.reduce((acc, r) => {
      const start = Math.floor(r.ratio / 10) * 10;
      const key = `${start}-${start + 9}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const chartData = Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));

    // 5. Генерация PDF через общий savePdf
    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir))
      fs.mkdirSync(reportsDir, { recursive: true });
    const pdfName = `${Date.now()}-comments-report.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);

    await savePdf(pdfPath, {
      title: "Отчёт по коэффициенту комментариев",
      avg: commentRatio,
      top5: top5Comment,
      chartData,
    });

    // 6. Формируем ответ по указанным reports
    const response = { success: true, pdfUrl: `/static/reports/${pdfName}` };

    if (reports.includes("commentRatio")) {
      response.commentRatio = commentRatio;
    }
    if (reports.includes("top5Comment")) {
      response.top5Comment = top5Comment;
    }
    if (reports.includes("distribution")) {
      response.chartData = chartData;
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
