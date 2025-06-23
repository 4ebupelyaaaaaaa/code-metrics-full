const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { analyzeDepth } = require("../services/analyzer/depthAnalyzer");
const { extractFilesFromArchive, readFile } = require("../utils/fileUtils");
const { savePdf } = require("../services/pdfGenerator");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "../tmp")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

router.post("/depth", upload.single("archive"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Нет поля archive" });
  }

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
    return res
      .status(400)
      .json({ success: false, error: "options.reports должен быть массивом" });
  }

  const threshold = parseInt(req.body.threshold, 10) || 0;
  const tmpPath = req.file.path;

  try {
    // 1. Распаковка или чтение одиночного файла
    const origName = req.file.originalname.toLowerCase();
    const files = origName.endsWith(".zip")
      ? await extractFilesFromArchive(tmpPath)
      : readFile(tmpPath);

    // 2. Анализ глубины
    const results = analyzeDepth(files);
    const allFunctions = results.flatMap((r) =>
      r.functions.map((f) => ({ ...f, file: r.file }))
    );
    const globalMaxDepth = results.reduce(
      (max, r) => Math.max(max, r.maxDepth),
      0
    );

    // 3. Считаем распределение глубин
    const depthCounts = allFunctions.reduce((acc, f) => {
      acc[f.depth] = (acc[f.depth] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.entries(depthCounts)
      .map(([depth, count]) => ({
        depth: Number(depth), // <— переименовали из complexity
        count,
      }))
      .sort((a, b) => a.depth - b.depth);

    // 4. Отбираем топ-5 по глубине (threshold по-прежнему действует)
    const top5Depth = allFunctions
      .filter((f) => f.depth > threshold)
      .sort((a, b) => b.depth - a.depth)
      .slice(0, 5)
      .map((f) => ({ name: f.name, depth: f.depth, file: f.file }));

    // 5. Формируем тело PDF
    const reportData = {
      title: "Отчёт по глубине вложенности",
      avg: globalMaxDepth,
      top5: top5Depth,
      chartData, // shorthand
    };

    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir))
      fs.mkdirSync(reportsDir, { recursive: true });
    const pdfName = `${Date.now()}-depth-report.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);
    await savePdf(pdfPath, reportData);

    // 6. Собираем ответ
    const responseJson = {
      success: true,
      pdfUrl: `/static/reports/${pdfName}`,
    };
    if (reports.includes("maxDepth")) responseJson.maxDepth = globalMaxDepth;
    if (reports.includes("top5Depth")) responseJson.top5Depth = top5Depth;
    if (reports.includes("distribution")) {
      // если в настройках пришёл distribution, отдадим его как chartData
      responseJson.chartData = chartData;
    }

    res.json(responseJson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    fs.unlink(tmpPath, () => {});
  }
});

module.exports = router;
