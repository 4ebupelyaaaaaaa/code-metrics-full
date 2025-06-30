const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { extractFilesFromArchive, readFile } = require("../utils/fileUtils");
const {
  analyzeInheritance,
} = require("../services/analyzer/inheritanceAnalyzer");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "../tmp")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

router.post("/inheritance", upload.single("archive"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Нет поля archive" });
  }

  let optionsObj;
  try {
    optionsObj = JSON.parse(req.body.options || "{}");
  } catch {
    return res.status(400).json({
      success: false,
      error: "options должен быть валидным JSON",
    });
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
    // Чтение файлов
    const orig = req.file.originalname.toLowerCase();
    const files = orig.endsWith(".zip")
      ? await extractFilesFromArchive(tmpPath)
      : readFile(tmpPath);

    // Анализ наследования
    const results = analyzeInheritance(files);
    const allClasses = results.flatMap((r) =>
      r.classes.map((c) => ({ ...c, file: r.file }))
    );
    const globalMax = results.reduce((m, r) => Math.max(m, r.maxDepth), 0);

    // Топ-5
    const top5Inheritance = allClasses
      .filter((c) => c.depth > threshold)
      .sort((a, b) => b.depth - a.depth)
      .slice(0, 5)
      .map((c) => ({
        name: c.name,
        inheritance: c.depth,
        file: c.file,
      }));

    const counts = allClasses.reduce((acc, c) => {
      acc[c.depth] = (acc[c.depth] || 0) + 1;
      return acc;
    }, {});
    const chartData = Object.entries(counts)
      .map(([depth, count]) => ({
        inheritance: Number(depth),
        count,
      }))
      .sort((a, b) => a.inheritance - b.inheritance);

    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfName = `${Date.now()}-inheritance-report.pdf`;

    const responseJson = {
      success: true,
      pdfUrl: `/static/reports/${pdfName}`,
    };
    if (reports.includes("maxInheritance")) {
      responseJson.maxInheritance = globalMax;
    }
    if (reports.includes("top5Inheritance")) {
      responseJson.top5Inheritance = top5Inheritance;
    }
    if (reports.includes("distribution")) {
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
