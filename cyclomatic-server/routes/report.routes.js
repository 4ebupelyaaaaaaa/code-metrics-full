// routes/report.routes.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const { extractFilesFromArchive, readFile } = require("../utils/fileUtils");
const { analyzeCognitive } = require("../services/analyzer/cognitiveAnalyzer");
const { analyzeComments } = require("../services/analyzer/commentAnalyzer");
const { analyzeCode } = require("../services/analyzer/codeAnalyzer");
const { analyzeDuplication } = require("../services/analyzer/nestingAnalyzer");
const {
  analyzeReadability,
} = require("../services/analyzer/readabilityAnalyzer");
const {
  analyzeInheritance,
} = require("../services/analyzer/inheritanceAnalyzer");
const {
  analyzeMaintainability,
} = require("../services/analyzer/maintainabilityAnalyzer");
const { analyzeDepth } = require("../services/analyzer/depthAnalyzer");
const { savePdf } = require("../services/pdfGenerator");

const router = express.Router();
const upload = multer({
  storage: multer.diskStorage({
    destination: (_, __, cb) => cb(null, path.join(__dirname, "../tmp")),
    filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
  }),
});

router.post("/report", upload.single("archive"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: "Нет поля archive" });
  }

  let options;
  try {
    options = JSON.parse(req.body.options || "{}");
  } catch {
    return res
      .status(400)
      .json({ success: false, error: "options должен быть JSON" });
  }

  const { reports = [], projectName: optName = "" } = options;

  if (!Array.isArray(reports)) {
    return res
      .status(400)
      .json({ success: false, error: "options.reports должен быть массивом" });
  }

  if (reports.length === 0) {
    return res
      .status(400)
      .json({ success: false, error: "Не выбраны метрики для анализа" });
  }

  // Если projectName не передан, берём из имени файла (без расширения)
  let projectName = optName;
  if (!projectName) {
    const original = req.file.originalname;
    projectName = path.basename(original, path.extname(original));
  }

  const tmpPath = req.file.path;
  try {
    // 1. Извлекаем или читаем одиночный файл
    const orig = req.file.originalname.toLowerCase();
    let files = [];
    if (orig.endsWith(".zip")) {
      files = await extractFilesFromArchive(tmpPath);
    } else {
      const single = readFile(tmpPath);
      files = Array.isArray(single) ? single : [single];
    }

    // 2. Запускаем все анализаторы
    const cogRes = analyzeCognitive(files);
    const commRes = analyzeComments(files);

    let cycloRes = [];
    for (const f of files) {
      cycloRes = cycloRes.concat(analyzeCode(f.code, f.name));
    }

    const dupRes = analyzeDuplication(files);
    const readRes = analyzeReadability(files);
    const inhRes = analyzeInheritance(files);
    const maintRes = analyzeMaintainability(files);
    const depthRes = analyzeDepth(files);

    // 3. Готовим все возможные данные

    // 3.1 когнитивная сложность
    const avgComplexity =
      cogRes.reduce((s, r) => s + r.avgComplexity, 0) / (cogRes.length || 1);

    const top5Complexity = cogRes
      .flatMap((r) =>
        r.functions.map((f) => ({
          "Имя функции": f.name,
          "Когниктивная сложность": f.complexity,
          Файл: r.file,
        }))
      )
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10);

    // 3.2 цикломатическая сложность
    cycloRes.sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity);
    const avgCyclomatic =
      cycloRes.reduce((s, f) => s + f.cyclomaticComplexity, 0) /
      (cycloRes.length || 1);
    const top5Cyclomatic = cycloRes
      .slice()
      .sort((a, b) => b.cyclomaticComplexity - a.cyclomaticComplexity)
      .slice(0, 10)
      .map(({ name, cyclomaticComplexity, file }) => ({
        "Имя функции": name,
        "Цикломатическая сложность": cyclomaticComplexity,
        Файл: file,
      }));

    // 3.3 коэффициент комментариев
    const totalLines = commRes.reduce((s, r) => s + r.totalLines, 0);
    const totalComments = commRes.reduce((s, r) => s + r.commentLines, 0);
    const commentRatio =
      totalLines > 0 ? (totalComments / totalLines) * 100 : 0;
    const top5Comment = commRes
      .slice()
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 10)
      .map(({ file, totalLines, commentLines, ratio }) => ({
        Файл: file,
        "Всего строк": totalLines,
        "Строк комментариев": commentLines,
        "Процент комментариев": ratio.toFixed(2),
      }));

    // 3.4 дублирование
    const { duplicationPercentage, duplicates } = dupRes;
    const topDuplicates = duplicates
      .slice()
      .sort((a, b) => b.count - a.count)
      .slice(0, 25)
      .map(({ line, count, files }) => ({
        "Фрагмент кода": line,
        "Количество дублей": count,
        "Списки файлов": files.join(", "),
      }));

    // 3.5 читабельность
    const avgReadability =
      readRes.reduce((s, r) => s + r.score, 0) / (readRes.length || 1);
    const top5Readability = readRes
      .slice()
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .map(({ file, score }) => ({
        Файл: file,
        "Оценка читабельности": score.toFixed(2),
      }));

    // 3.6 индекс ремонтопригодности (MI)
    const avgMI =
      maintRes.reduce((s, r) => s + r.mi, 0) / (maintRes.length || 1);
    const top5Maintainability = maintRes
      .slice()
      .sort((a, b) => a.mi - b.mi) // от самых маленьких mi
      .slice(0, 10)
      .map(({ file, mi }) => ({
        Файл: file,
        "Индекс ремонтопригодности (MI)": mi.toFixed(2),
      }));

    // 3.7 наследование
    const allClasses = inhRes.flatMap((r) => r.classes);
    const maxInheritance = inhRes.reduce((m, r) => Math.max(m, r.maxDepth), 0);
    const isFunctionalOnly = inhRes.every((r) => r.classes.length === 0);

    const top5Inheritance = allClasses
      .filter((c) => c.depth > 0)
      .sort((a, b) => b.depth - a.depth)
      .slice(0, 10)
      .map(({ name, depth, file }) => ({
        "Имя класса": name,
        "Глубина наследования": depth,
        Файл: file,
      }));

    // 3.8 глубина вложенности
    // Здесь заменили r.name на r.file (имя файла хранится в поле file)
    const allFuncs = depthRes.flatMap((r) =>
      r.functions.map((f) => ({
        name: f.name,
        depth: f.depth,
        file: r.file, // исправлено: раньше было r.name → undefined
      }))
    );
    const maxDepth = depthRes.reduce((m, r) => Math.max(m, r.maxDepth), 0);
    const top5Depth = allFuncs
      .filter((f) => f.depth > 0)
      .sort((a, b) => b.depth - a.depth)
      .slice(0, 10)
      .map(({ name, depth, file }) => ({
        "Имя функции": name,
        "Глубина вложенности": depth,
        Файл: file,
      }));

    // 3.9 вспомогатель для распределений
    const makeDist = (arr, key) => {
      const map = {};
      arr.forEach((item) => {
        const v = item[key];
        map[v] = (map[v] || 0) + 1;
      });
      return Object.entries(map)
        .map(([v, c]) => ({ [key]: Number(v), count: c }))
        .sort((a, b) => a[key] - b[key]);
    };

    const distributionComplexity = makeDist(
      cogRes.flatMap((r) => r.functions),
      "complexity"
    );
    const distributionCyclomatic = makeDist(cycloRes, "cyclomaticComplexity");
    const distributionComment = commRes
      .map((r) => r.ratio)
      .reduce((acc, ratio) => {
        const b = `${Math.floor(ratio / 10) * 10}-${
          Math.floor(ratio / 10) * 10 + 9
        }`;
        acc[b] = (acc[b] || 0) + 1;
        return acc;
      }, {});
    const distributionReadability = readRes
      .map((r) => r.score)
      .reduce((acc, score) => {
        const b = `${Math.floor(score / 10) * 10}-${
          Math.floor(score / 10) * 10 + 9
        }`;
        acc[b] = (acc[b] || 0) + 1;
        return acc;
      }, {});
    const distributionMaintainability = maintRes
      .map((r) => r.mi)
      .reduce((acc, mi) => {
        const b = `${Math.floor(mi / 10) * 10}-${Math.floor(mi / 10) * 10 + 9}`;
        acc[b] = (acc[b] || 0) + 1;
        return acc;
      }, {});
    const distributionInheritance = allClasses.reduce((acc, c) => {
      const d = c.depth;
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});
    const distributionDepth = allFuncs.reduce((acc, f) => {
      const d = f.depth;
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {});

    // 4. Собираем секции по ключам из options.reports, но с русскими заголовками:
    const sections = reports
      .map((key) => {
        switch (key) {
          case "avgComplexity":
            return {
              heading: "Среднее значение когнитивной сложности",
              data: avgComplexity,
            };
          case "avgCyclomatic":
            return {
              heading: "Среднее значение цикломатической сложности",
              data: avgCyclomatic,
            };
          case "commentRatio":
            return {
              heading: "Общий процент комментариев",
              data: `${commentRatio.toFixed(2)}%`,
            };
          case "duplicatedLines":
            return {
              heading: "Количество дублирующихся строк",
              data: dupRes.duplicatedLines,
            };
          case "duplicationPercentage":
            return {
              heading: "Процент дублирования",
              data: duplicationPercentage,
            };
          case "avgReadability":
            return { heading: "Средняя читабельность", data: avgReadability };
          case "avgMI":
            return { heading: "Индекс ремонтопригодности", data: avgMI };
          case "maxInheritance":
            return {
              heading: "Максимальная глубина наследования",
              data: isFunctionalOnly
                ? "Проект не использует классы"
                : maxInheritance,
            };
          case "maxDepth":
            return {
              heading: "Максимальная глубина вложенности",
              data: maxDepth,
            };

          // ===== таблицы (списки с объектами) =====
          case "top5Complexity":
            return {
              heading: "Функции с высокой когнитивной сложностью",
              data: top5Complexity,
            };
          case "top5Cyclomatic":
            return {
              heading: "Функции с высокой цикломатической сложностью",
              data: top5Cyclomatic,
            };
          case "top5Comment":
            return {
              heading: "Файлы с наименьшим количеством комментариев",
              data: top5Comment,
            };
          case "topDuplicates":
            return {
              heading: "Список мест, где найдено дублирование",
              data: topDuplicates,
            };
          case "top5Readability":
            return {
              heading: "Функции с низкой читабельностью",
              data: top5Readability,
            };
          case "top5Maintainability":
            return {
              heading: "Файлы с низкой ремонтопригодностью",
              data: top5Maintainability,
            };
          case "top5Inheritance":
            return {
              heading: "Классы с глубокой иерархией",
              data: top5Inheritance,
            };
          case "top5Depth":
            return {
              heading: "Список функций с превышением глубины вложенности",
              data: top5Depth,
            };

          // ===== графики (распределения) =====
          case "distributionComplexity":
            return {
              heading: "Распределение когнитивной сложности",
              data: distributionComplexity,
            };
          case "distributionCyclomatic":
            return {
              heading: "Распределение цикломатической сложности",
              data: distributionCyclomatic,
            };
          case "distributionComment":
            return {
              heading: "Распределение коэффициента комментариев",
              data: Object.entries(distributionComment).map(
                ([range, count]) => ({ range: `${range}%`, count })
              ),
            };
          case "distributionReadability":
            return {
              heading: "Распределение читабельности",
              data: Object.entries(distributionReadability).map(
                ([range, count]) => ({ range, count })
              ),
            };
          case "distributionMaintainability":
            return {
              heading: "Распределение индекса ремонтопригодности MI",
              data: Object.entries(distributionMaintainability).map(
                ([range, count]) => ({ range, count })
              ),
            };
          case "distributionInheritance":
            return {
              heading: "Распределение глубины наследования",
              data: Object.entries(distributionInheritance).map(
                ([value, count]) => ({
                  depth: Number(value),
                  count,
                })
              ),
            };
          case "distributionDepth":
            return {
              heading: "Распределение глубины вложенности",
              data: Object.entries(distributionDepth).map(([value, count]) => ({
                depth: Number(value),
                count,
              })),
            };
        }
      })
      .filter(Boolean);

    // 5. Генерируем PDF
    const reportsDir = path.join(__dirname, "../static/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    const pdfName = `${Date.now()}-full-report.pdf`;
    const pdfPath = path.join(reportsDir, pdfName);

    // Передаём projectName и sections (с заголовками уже на русском)
    await savePdf(pdfPath, {
      title: "Отчёт по проекту",
      projectName,
      sections,
    });

    // 6. Отправляем ответ
    const response = { success: true, pdfUrl: `/static/reports/${pdfName}` };
    reports.forEach((key) => {
      switch (key) {
        case "avgComplexity":
          response.avgComplexity = Number(avgComplexity.toFixed(2));
          break;
        case "top5Complexity":
          response.top5Complexity = top5Complexity;
          break;
        case "distributionComplexity":
          response.distributionComplexity = distributionComplexity;
          break;
        case "avgCyclomatic":
          response.avgCyclomatic = Number(avgCyclomatic.toFixed(2));
          break;
        case "top5Cyclomatic":
          response.top5Cyclomatic = top5Cyclomatic;
          break;
        case "distributionCyclomatic":
          response.distributionCyclomatic = distributionCyclomatic;
          break;
        case "commentRatio":
          // запоминаем как строку с % на конце
          response.commentRatio = `${commentRatio.toFixed(2)}%`;
          break;
        case "top5Comment":
          response.top5Comment = top5Comment;
          break;
        case "distributionComment":
          response.distributionComment = Object.entries(
            distributionComment
          ).map(([r, c]) => ({
            // добавляем '%' к каждому диапазону
            range: `${r}%`,
            count: c,
          }));
          break;
        case "duplicatedLines":
          response.duplicatedLines = dupRes.duplicatedLines;
          break;
        case "duplicationPercentage":
          response.duplicationPercentage = Number(
            duplicationPercentage.toFixed(2)
          );
          break;
        case "topDuplicates":
          response.topDuplicates = topDuplicates;
          break;
        case "avgReadability":
          response.avgReadability = Number(avgReadability.toFixed(2));
          break;
        case "top5Readability":
          response.top5Readability = top5Readability;
          break;
        case "distributionReadability":
          response.distributionReadability = Object.entries(
            distributionReadability
          ).map(([r, c]) => ({ range: r, count: c }));
          break;
        case "avgMI":
          response.avgMI = Number(avgMI.toFixed(2));
          break;
        case "top5Maintainability":
          response.top5Maintainability = top5Maintainability;
          break;
        case "distributionMaintainability":
          response.distributionMaintainability = Object.entries(
            distributionMaintainability
          ).map(([r, c]) => ({ range: r, count: c }));
          break;
        case "maxInheritance":
          response.maxInheritance = isFunctionalOnly
            ? "Проект не использует классы"
            : maxInheritance;
          break;
        case "top5Inheritance":
          response.top5Inheritance = top5Inheritance;
          break;
        case "distributionInheritance":
          response.distributionInheritance = Object.entries(
            distributionInheritance
          ).map(([d, c]) => ({ depth: Number(d), count: c }));
          break;
        case "maxDepth":
          response.maxDepth = maxDepth;
          break;
        case "top5Depth":
          response.top5Depth = top5Depth;
          break;
        case "distributionDepth":
          response.distributionDepth = Object.entries(distributionDepth).map(
            ([d, c]) => ({ depth: Number(d), count: c })
          );
          break;
      }
    });

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    fs.unlink(tmpPath, () => {});
  }
});

module.exports = router;
