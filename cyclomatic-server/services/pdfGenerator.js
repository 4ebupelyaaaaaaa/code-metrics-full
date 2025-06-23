// services/pdfGenerator.js

const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const HEADER_TRANSLATIONS = {
  file: "Файл",
  name: "Функция",
  depth: "Глубина вложенности",
  count: "Количество",
  line: "Фрагмент",
  complexity: "Сложность",
  cyclomaticComplexity: "Цикломатическая сложность",
  ratio: "Коэффициент",
  mi: "Индекс MI",
  score: "Читабельность",
};

async function savePdf(filePath, report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    const fontPath = path.join(__dirname, "../fonts/Roboto-Regular.ttf");
    doc.registerFont("Roboto", fontPath);

    const colors = {
      headerBg: "#060823",
      cardBg: "#ECF0F1",
      cardBorder: "#BDC3C7",
      text: "#2C3E50",
      accent: "#30849C",
      chartBar: "#9DDCE5",
      footer: "#7F8C8D",
    };

    const pageBottom = doc.page.height - 60;
    let cursorY = 100;

    function ensureSpace(height) {
      if (cursorY + height > pageBottom) {
        doc.addPage();
        cursorY = 50;
      }
      doc.y = cursorY;
    }

    // Шапка
    doc.rect(0, 0, doc.page.width, 80).fill(colors.headerBg);
    const logoPath = path.join(__dirname, "../static/assets/logo.png");
    if (fs.existsSync(logoPath)) {
      try {
        doc.image(logoPath, doc.page.width - 110, 20, { width: 90 });
      } catch (e) {
        console.warn("Не удалось вставить logo.png:", e.message);
      }
    }

    doc
      .fillColor("white")
      .font("Roboto")
      .fontSize(16)
      .text("Отчёт по проекту", 50, 25);
    if (report.projectName) {
      doc.fontSize(20).text(report.projectName, 50, 50, {
        width: doc.page.width - 160,
        align: "left",
      });
    }

    cursorY = 100;

    // Карточки
    const nums = report.sections.filter(
      (s) =>
        typeof s.data === "number" || s.heading === "Общий процент комментариев"
    );
    if (nums.length) {
      const colW = (doc.page.width - 150) / 2;
      const rowH = 70;
      for (let i = 0; i < nums.length; i += 2) {
        ensureSpace(rowH + 20);
        const rowItems = nums.slice(i, i + 2);
        rowItems.forEach((sec, col) => {
          const x = 50 + col * (colW + 50);
          const y = cursorY;
          doc
            .rect(x, y, colW, rowH)
            .fill(colors.cardBg)
            .stroke(colors.cardBorder);
          doc.fillColor(colors.text).fontSize(12);
          const titleHeight = doc.heightOfString(sec.heading, {
            width: colW - 20,
          });
          doc.text(sec.heading, x + 10, y + 8, {
            width: colW - 20,
          });
          const raw = sec.data;
          const value = typeof raw === "number" ? raw.toFixed(2) : String(raw);
          doc
            .fillColor(colors.accent)
            .fontSize(20)
            .text(value, x + 10, y + 8 + titleHeight + 6);
        });
        cursorY += rowH + 20;
        doc.y = cursorY;
      }
    }

    // Строковые значения (например: "Проект написан в функциональном стиле...")
    const texts = report.sections.filter(
      (s) =>
        typeof s.data === "string" && s.heading !== "Общий процент комментариев"
    );
    if (texts.length) {
      for (const sec of texts) {
        ensureSpace(80);
        const boxH = 60;
        const boxW = doc.page.width - 100;
        const x = 50;
        const y = cursorY;
        doc
          .rect(x, y, boxW, boxH)
          .fill(colors.cardBg)
          .stroke(colors.cardBorder);

        doc
          .fillColor(colors.text)
          .fontSize(12)
          .text(sec.heading, x + 10, y + 8, {
            width: boxW - 20,
          });

        doc
          .fillColor(colors.accent)
          .fontSize(14)
          .text(sec.data, x + 10, y + 30, {
            width: boxW - 20,
          });

        cursorY += boxH + 20;
        doc.y = cursorY;
      }
    }

    // Таблицы (ограничим до первых 10 строк)
    const lists = report.sections.filter(
      (s) =>
        s.heading === "Список мест, где найдено дублирование" ||
        (Array.isArray(s.data) &&
          s.data.length &&
          typeof s.data[0] === "object" &&
          !("count" in s.data[0]))
    );

    for (const sec of lists) {
      // Берём максимум 10 элементов из секции
      const dataSlice = sec.data.slice(0, 10);

      const rawRows = dataSlice.map((row) =>
        Object.values(row).map((v) => String(v))
      );
      const headers = Object.keys(dataSlice[0]).map(
        (key) => HEADER_TRANSLATIONS[key] || key
      );
      const colCount = headers.length;
      const colW = (doc.page.width - 100) / colCount;
      const padding = 4;

      const headerRowH =
        Math.max(
          ...headers.map((h) =>
            doc.heightOfString(h, {
              width: colW - 2 * padding,
              align: "left",
              font: "Roboto",
              size: 10,
            })
          )
        ) +
        2 * padding;

      const rowHeights = rawRows.map((vals) => {
        return (
          Math.max(
            ...vals.map((val) =>
              doc.heightOfString(val, {
                width: colW - 2 * padding,
                align: "left",
                font: "Roboto",
                size: 10,
              })
            )
          ) +
          2 * padding
        );
      });

      const tableH = headerRowH + rowHeights.reduce((a, b) => a + b, 0);
      ensureSpace(tableH + 30);

      doc.fillColor(colors.text).fontSize(16).text(sec.heading, 50, cursorY);
      cursorY += 24;

      let rowY = cursorY;
      // Рисуем заголовки таблицы
      headers.forEach((h, i) => {
        const x = 50 + i * colW;
        doc
          .rect(x, rowY, colW, headerRowH)
          .fill(colors.cardBg)
          .stroke(colors.cardBorder);
        doc
          .fillColor(colors.text)
          .fontSize(10)
          .text(h, x + padding, rowY + padding, {
            width: colW - 2 * padding,
          });
      });
      rowY += headerRowH;

      // Рисуем строки (до 10 штук)
      rawRows.forEach((vals, rowIndex) => {
        const rh = rowHeights[rowIndex];
        vals.forEach((val, i) => {
          const x = 50 + i * colW;
          doc.rect(x, rowY, colW, rh).stroke();
          doc
            .fillColor(colors.text)
            .fontSize(10)
            .text(val, x + padding, rowY + padding, {
              width: colW - 2 * padding,
              align: "left",
            });
        });
        rowY += rh;
        ensureSpace(0);
      });

      cursorY = rowY + 20;
      doc.y = cursorY;
    }

    // Графики с подписями осей
    const charts = report.sections.filter(
      (s) =>
        s.heading !== "Список мест, где найдено дублирование" &&
        Array.isArray(s.data) &&
        s.data.length &&
        "count" in s.data[0]
    );

    for (const sec of charts) {
      const chartH = 180;
      const gap = 20; // стало меньше
      ensureSpace(chartH + 80); // стало больше (запас под оси + подпись)

      doc.fillColor(colors.text).fontSize(16).text(sec.heading, 50, cursorY);
      cursorY += 36; // увеличено расстояние до графика

      const data = sec.data;
      const labels = data.map(
        (d) =>
          d.range ?? d.complexity ?? d.depth ?? d.cyclomaticComplexity ?? "?"
      );
      const counts = data.map((d) => d.count);
      const maxCount = Math.max(...counts, 1);
      const chartX = 50;
      const chartY = cursorY;
      const chartW = doc.page.width - 100;
      const barW = Math.min(40, (chartW / labels.length) * 0.6);
      const chartGap =
        labels.length > 1
          ? (chartW - barW * labels.length) / (labels.length - 1)
          : 0;

      const yMax = 150;

      // Горизонтальная сетка без чисел
      const tickCount = 5;
      for (let i = 0; i < tickCount; i++) {
        const y = chartY + yMax - (i / (tickCount - 1)) * yMax;
        doc
          .strokeColor("#E0E0E0")
          .lineWidth(0.5)
          .moveTo(chartX, y)
          .lineTo(chartX + chartW, y)
          .stroke();
      }

      // Ось Y
      doc
        .strokeColor(colors.text)
        .lineWidth(1)
        .moveTo(chartX, chartY)
        .lineTo(chartX, chartY + yMax)
        .stroke();

      // Вертикальный текст "Количество"
      doc
        .save()
        .rotate(-90, { origin: [chartX - 40, chartY + yMax / 2] })
        .fontSize(10)
        .fillColor(colors.footer)
        .text("Количество", chartX - 40, chartY + yMax / 2 - 20, {
          width: yMax,
          align: "center",
        })
        .restore();

      // Ось X
      doc
        .strokeColor(colors.text)
        .lineWidth(1)
        .moveTo(chartX, chartY + yMax)
        .lineTo(chartX + chartW, chartY + yMax)
        .stroke();

      // Подпись оси X
      doc
        .fontSize(10)
        .fillColor(colors.footer)
        .text("Значение метрики", chartX, chartY + yMax + 25, {
          width: chartW,
          align: "center",
        });

      // Столбцы
      labels.forEach((lbl, idx) => {
        const x = chartX + idx * (barW + chartGap);
        const h = (counts[idx] / maxCount) * yMax;
        const y = chartY + yMax - h;
        doc.rect(x, y, barW, h).fill(colors.chartBar);
        doc
          .fillColor(colors.text)
          .fontSize(10)
          .text(String(counts[idx]), x, y - 12, {
            width: barW,
            align: "center",
          });
        doc
          .fillColor(colors.text)
          .fontSize(8)
          .text(String(lbl), x, chartY + yMax + 4, {
            width: barW,
            align: "center",
          });
      });

      cursorY += chartH + gap;
      doc.y = cursorY;
    }

    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });
}

module.exports = { savePdf };
