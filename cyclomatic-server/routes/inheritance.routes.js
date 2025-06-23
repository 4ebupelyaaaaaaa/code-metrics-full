// routes/inheritance.routes.js
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
    // 1. Распаковка или чтение одиночного файла
    const orig = req.file.originalname.toLowerCase();
    const files = orig.endsWith(".zip")
      ? await extractFilesFromArchive(tmpPath)
      : readFile(tmpPath);

    // 2. Анализ наследования
    const results = analyzeInheritance(files);
    // Включаем имя файла в каждый класс
    const allClasses = results.flatMap((r) =>
      r.classes.map((c) => ({ ...c, file: r.file }))
    );
    const globalMax = results.reduce((m, r) => Math.max(m, r.maxDepth), 0);

    // 3. Собираем топ-5 и распределение
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

    // 4. Генерация PDF (pdfkit или ваша реализация)
    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfName = `${Date.now()}-inheritance-report.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);
    // Здесь вставьте код генерации PDF, использующий top5Inheritance и chartData
    // Например, используя pdfkit:
    //
    // const PDFDocument = require("pdfkit");
    // const doc = new PDFDocument({ margin: 50 });
    // const ws = fs.createWriteStream(pdfPath);
    // doc.pipe(ws);
    // doc.fontSize(18).text("Отчёт по глубине наследования", { align: "center" }).moveDown();
    // if (reports.includes("maxInheritance")) {
    //   doc.fontSize(12).text(`Максимальная глубина наследования: ${globalMax}`).moveDown();
    // }
    // if (reports.includes("top5Inheritance")) {
    //   doc.fontSize(14).text("Топ-5 глубоких иерархий").moveDown(0.5);
    //   top5Inheritance.forEach(c =>
    //     doc.fontSize(12).text(`• ${c.name} (inheritance=${c.inheritance}) — ${c.file}`)
    //   );
    //   doc.moveDown();
    // }
    // if (reports.includes("distribution")) {
    //   doc.fontSize(14).text("Распределение глубины наследования").moveDown(0.5);
    //   chartData.forEach(d =>
    //     doc.fontSize(12).text(`Inheritance ${d.inheritance}: ${d.count} классов`)
    //   );
    //   doc.moveDown();
    // }
    // doc.end();
    // await new Promise(r => ws.on("finish", r));

    // 5. Формируем JSON-ответ
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
