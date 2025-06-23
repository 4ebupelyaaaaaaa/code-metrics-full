// routes/cyclomatic.routes.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { extractFilesFromArchive, readFile } = require("../utils/fileUtils");
const { analyzeCode } = require("../services/analyzer/codeAnalyzer");
const { savePdf } = require("../services/pdfGenerator");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "../tmp")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

router.post("/cyclomatic", upload.single("archive"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "Файл не загружен: убедитесь, что поле 'archive' типа File",
    });
  }

  // Разбираем опции: какие поля возвращать
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
    const orig = req.file.originalname.toLowerCase();
    const files = orig.endsWith(".zip")
      ? await extractFilesFromArchive(tmpPath)
      : readFile(tmpPath);

    // 2. Анализ цикломатической сложности
    let results = [];
    for (const f of files) {
      results = results.concat(analyzeCode(f.code, f.name));
    }

    // 3. Сортируем и вычисляем avg
    results.sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity);
    const top5Cyclomatic = results.slice(0, 5);
    const avgCyclomatic =
      results.length > 0
        ? results.reduce((sum, fn) => sum + fn.cyclomaticComplexity, 0) /
          results.length
        : 0;

    // 4. Готовим chartData (distribution)
    const distMap = results.reduce((acc, fn) => {
      const cc = fn.cyclomaticComplexity;
      acc[cc] = (acc[cc] || 0) + 1;
      return acc;
    }, {});
    const chartData = Object.entries(distMap)
      .map(([complexity, count]) => ({
        complexity: Number(complexity),
        count,
      }))
      .sort((a, b) => a.complexity - b.complexity)
      .slice(0, 10);

    // 5. Генерируем PDF
    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfName = `${Date.now()}-cyclomatic.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);

    await savePdf(pdfPath, {
      title: "Отчёт по цикломатической сложности",
      avg: avgCyclomatic,
      top5: top5Cyclomatic,
      chartData,
    });

    // 6. Формируем ответ только с нужными полями
    const response = { success: true, pdfUrl: `/static/reports/${pdfName}` };

    if (reports.includes("avgCyclomatic")) {
      response.avgCyclomatic = Number(avgCyclomatic.toFixed(2));
    }
    if (reports.includes("top5Cyclomatic")) {
      response.top5Cyclomatic = top5Cyclomatic;
    }
    if (reports.includes("distribution")) {
      response.chartData = chartData;
    }

    return res.json(response);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  } finally {
    fs.unlink(tmpPath, () => {});
  }
});

module.exports = router;
