//отрефакторить, дублирование лейблов
export const metricLabels: Record<string, string> = {
  avgComplexity: "Среднее значение когнитивной сложности",
  avgCyclomatic: "Среднее значение цикломатической сложности",
  commentRatio: "Общий процент комментариев",
  duplicatedLines: "Количество дублирующихся строк",
  duplicationPercentage: "Процент дублирования",
  avgReadability: "Средняя читабельность",
  avgMI: "Индекс ремонтопригодности",
  maxInheritance: "Максимальная глубина наследования",
  maxDepth: "Максимальная глубина вложенности",

  top5Complexity: "Функции с высокой когнитивной сложностью",
  top5Cyclomatic: "Функции с высокой цикломатической сложностью",
  top5Comment: "Файлы с наименьшим количеством комментариев",
  topDuplicates: "Список мест, где найдено дублирование",
  top5Readability: "Функции с низкой читабельностью",
  top5Maintainability: "Файлы с низкой ремонтопригодностью",
  top5Inheritance: "Классы с глубокой иерархией",
  top5Depth: "Список функций с превышением глубины вложенности",

  distributionComplexity: "Распределение когнитивной сложности",
  distributionCyclomatic: "Распределение цикломатической сложности",
  distributionComment: "Распределение коэффициента комментов",
  distributionReadability: "Распределение читабельности",
  distributionMaintainability: "Распределение индекса ремонтопригодности MI",
  distributionInheritance: "Распределение глубины наследования",
  distributionDepth: "Распределение глубины вложенности",
};
