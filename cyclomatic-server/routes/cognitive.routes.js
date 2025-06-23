// routes/cognitive.routes.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { analyzeCognitive } = require("../services/analyzer/cognitiveAnalyzer");
const { extractFilesFromArchive } = require("../utils/fileUtils");
const { savePdf } = require("../services/pdfGenerator");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "../tmp")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

router.post("/cognitive", upload.single("archive"), async (req, res) => {
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
    // 1. Извлекаем файлы из архива
    const files = await extractFilesFromArchive(tmpPath);

    // 2. Анализ когнитивной сложности
    const results = analyzeCognitive(files);
    const allFuncs = results.flatMap((r) => r.functions);

    // 3. Вычисляем среднюю сложность
    const globalAvg =
      results.reduce((sum, r) => sum + r.avgComplexity, 0) /
      (results.length || 1);

    // 4. Составляем топ-5 функций по сложности
    const top5Complexity = allFuncs
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 5)
      .map((f) => ({ name: f.name, complexity: f.complexity }));

    // 5. Готовим данные для графика распределения
    const distMap = allFuncs.reduce((acc, f) => {
      acc[f.complexity] = (acc[f.complexity] || 0) + 1;
      return acc;
    }, {});
    const chartData = Object.entries(distMap)
      .map(([complexity, count]) => ({
        complexity: Number(complexity),
        count,
      }))
      .sort((a, b) => a.complexity - b.complexity);

    // 6. Генерируем PDF (всегда полный)
    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfName = `${Date.now()}-cognitive-report.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);

    await savePdf(pdfPath, {
      title: "Отчёт по когнитивной сложности",
      avg: globalAvg,
      top5: top5Complexity,
      chartData,
    });

    // 7. Собираем ответ только с нужными полями
    const response = { success: true, pdfUrl: `/static/reports/${pdfName}` };

    if (reports.includes("avgComplexity")) {
      response.avgComplexity = Number(globalAvg.toFixed(2));
    }
    if (reports.includes("top5Complexity")) {
      response.top5Complexity = top5Complexity;
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
