const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { extractFilesFromArchive, readFile } = require("../utils/fileUtils");
const {
  analyzeReadability,
} = require("../services/analyzer/readabilityAnalyzer");
const { savePdf } = require("../services/pdfGenerator");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "../tmp")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

router.post("/readability", upload.single("archive"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Нет поля archive" });
  }

  // Разбираем опции
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
    // Читаем файлы
    const orig = req.file.originalname.toLowerCase();
    const files = orig.endsWith(".zip")
      ? await extractFilesFromArchive(tmpPath)
      : Array.isArray(readFile(tmpPath))
      ? readFile(tmpPath)
      : [readFile(tmpPath)];

    // Анализ читабельности
    const results = analyzeReadability(files);

    // Среднее значение
    const avgReadability =
      results.reduce((sum, r) => sum + r.score, 0) / (results.length || 1);

    // Топ-5 худших
    const top5Readability = results
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
      .map((r) => ({ file: r.file, score: r.score }));

    //График
    const buckets = results.reduce((acc, r) => {
      const start = Math.floor(r.score / 10) * 10;
      const key = `${start}-${start + 9}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    const chartData = Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));

    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir))
      fs.mkdirSync(reportsDir, { recursive: true });
    const pdfName = `${Date.now()}-readability-report.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);

    await savePdf(pdfPath, {
      title: "Отчёт по читабельности кода",
      avg: avgReadability,
      top5: top5Readability,
      chartData,
    });

    const response = { success: true, pdfUrl: `/static/reports/${pdfName}` };

    if (reports.includes("avgReadability")) {
      response.avgReadability = Number(avgReadability.toFixed(2));
    }
    if (reports.includes("top5Readability")) {
      response.top5Readability = top5Readability;
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
