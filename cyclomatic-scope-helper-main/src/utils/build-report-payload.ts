// надо что-то с этим сделать, не тут будем собирать
export interface ReportPayload {
  reports: string[];
}

const REPORT_KEY_MAP: Record<string, string> = {
  // Сложность
  "Среднее значение сложности по проекту": "avgCyclomatic",
  "Функции с высокой цикломатической сложностью": "top5Cyclomatic",
  "Распределение сложности": "distributionCyclomatic",
  "Максимальная глубина вложенности": "maxDepth",
  "Список функций с превышением допустимой глубины": "top5Depth",
  "Распределение вложенности": "distributionDepth",
  "Среднее значение когнитивной сложности": "avgComplexity",
  "Функции с высокой когнитивной сложностью": "top5Complexity",
  "Распределение когнитивной сложности": "distributionComplexity",
  "Максимальная глубина наследования": "maxInheritance",
  "Классы с глубокой иерархией": "top5Inheritance",
  "Распределение глубины наследования": "distributionInheritance",

  // Качество
  "Количество дублирующихся строк": "duplicatedLines",
  "Список мест, где найдено дублирование": "topDuplicates",
  "Процент дублирования": "duplicationPercentage",
  "Индекс ремонтопригодности MI": "avgMI",
  "Файлы с низкой ремонтопригодностью": "top5Maintainability",
  "Распределение ремонтопригодности": "distributionMaintainability",
  "Общий процент комментариев": "commentRatio",
  "Файлы с наименьшим количеством комментариев": "top5Comment",
  "Распределение комментариев": "distributionComment",
  "Среднее значение читабельности": "avgReadability",
  "Функции с низкой читабельностью": "top5Readability",
  "Распределение читабельности по файлам": "distributionReadability",
};

export function buildReportPayload(selectedReports: string[]): ReportPayload {
  const reports = selectedReports
    .map((label) => REPORT_KEY_MAP[label])
    .filter((key): key is string => Boolean(key));
  return { reports };
}
