// routes/maintainability.routes.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const PDFDocument = require("pdfkit");
const { extractFilesFromArchive, readFile } = require("../utils/fileUtils"); // Импорт утилиты
const {
  analyzeMaintainability,
  MI_THRESHOLD,
} = require("../services/analyzer/maintainabilityAnalyzer");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "../tmp")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

router.post("/maintainability", upload.single("archive"), async (req, res) => {
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
    return res.status(400).json({
      success: false,
      error: "options.reports должен быть массивом",
    });
  }

  const tmpPath = req.file.path;
  const files = [];

  try {
    const orig = req.file.originalname.toLowerCase();
    if (orig.endsWith(".zip")) {
      const extractedFiles = await extractFilesFromArchive(tmpPath);
      files.push(...extractedFiles);
    } else {
      const fileContent = readFile(tmpPath);
      files.push(...fileContent);
    }

    const results = analyzeMaintainability(files);

    const avgMI =
      results.reduce((sum, r) => sum + r.mi, 0) / (results.length || 1);

    const low = results
      .filter((r) => r.mi < MI_THRESHOLD)
      .sort((a, b) => a.mi - b.mi)
      .slice(0, 5)
      .map((r) => ({
        name: path.basename(r.file, path.extname(r.file)),
        file: r.file,
        mi: r.mi,
      }));

    const buckets = {};
    results.forEach((r) => {
      const rangeStart = Math.floor(r.mi / 10) * 10;
      const key = `${rangeStart}-${rangeStart + 9}`;
      buckets[key] = (buckets[key] || 0) + 1;
    });

    const chartData = Object.entries(buckets).map(([range, count]) => ({
      range,
      count,
    }));

    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir))
      fs.mkdirSync(reportsDir, { recursive: true });

    const pdfName = `${Date.now()}-maintainability-report.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);
    const doc = new PDFDocument({ margin: 50 });
    const ws = fs.createWriteStream(pdfPath);
    doc.pipe(ws);

    doc
      .fontSize(18)
      .text("Отчёт по ремонтопригодности", { align: "center" })
      .moveDown();
    doc.fontSize(12).text(`Файлов обработано: ${results.length}`).moveDown();

    reports.forEach((metric) => {
      switch (metric) {
        case "avgMI":
          doc.fontSize(14).text("Средний MI").moveDown(0.5);
          doc
            .fontSize(12)
            .text(`Средний MI: ${avgMI.toFixed(2)}`)
            .moveDown();
          break;

        case "top5Maintainability":
          doc.fontSize(14).text("Файлы с низким MI").moveDown(0.5);
          if (!low.length) {
            doc.fontSize(12).text("Нет файлов с низким MI.");
          } else {
            low.forEach((f) =>
              doc.fontSize(12).text(`• ${f.file}: MI = ${f.mi.toFixed(2)}`)
            );
          }
          doc.moveDown();
          break;

        case "distribution":
          doc.fontSize(14).text("Распределение MI").moveDown(0.5);
          chartData.forEach(({ range, count }) =>
            doc.fontSize(12).text(`Range ${range}: ${count} файлов`)
          );
          doc.moveDown();
          break;
      }
    });

    doc.end();
    await new Promise((r) => ws.on("finish", r));

    const response = {
      success: true,
      pdfUrl: `/static/reports/${pdfName}`,
    };

    if (reports.includes("avgMI")) {
      response.avgMI = parseFloat(avgMI.toFixed(2));
    }
    if (reports.includes("top5Maintainability")) {
      response.top5Maintainability = low;
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
