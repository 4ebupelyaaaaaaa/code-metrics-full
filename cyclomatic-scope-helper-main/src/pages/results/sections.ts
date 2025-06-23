// src/pages/results/sections.ts
import type { AnalysisResponse } from "@/shared/api/get-report";

export interface SectionConfig {
  key: string;
  title: string;
  cardKey?: keyof AnalysisResponse;
  cardKeys?: Array<keyof AnalysisResponse>;
  tableKey?: keyof AnalysisResponse;
  chartKey?: keyof AnalysisResponse;
}

export const sections: SectionConfig[] = [
  {
    key: "cognitive",
    title: "Когнитивная сложность",
    cardKey: "avgComplexity",
    tableKey: "top5Complexity",
    chartKey: "distributionComplexity",
  },
  {
    key: "cyclomatic",
    title: "Цикломатическая сложность",
    cardKey: "avgCyclomatic",
    tableKey: "top5Cyclomatic",
    chartKey: "distributionCyclomatic",
  },
  {
    key: "depth",
    title: "Глубина вложенности",
    cardKey: "maxDepth",
    tableKey: "top5Depth",
    chartKey: "distributionDepth",
  },
  {
    key: "inheritance",
    title: "Глубина наследования",
    cardKey: "maxInheritance",
    tableKey: "top5Inheritance",
    chartKey: "distributionInheritance",
  },
  {
    key: "duplication",
    title: "Дублирование кода",
    cardKeys: ["duplicationPercentage", "duplicatedLines"],
    tableKey: "topDuplicates",
  },
  {
    key: "comments",
    title: "Коэфициент комментариев",
    cardKey: "commentRatio",
    tableKey: "top5Comment",
    chartKey: "distributionComment",
  },
  {
    key: "readability",
    title: "Читабельность кода",
    cardKey: "avgReadability",
    tableKey: "top5Readability",
    chartKey: "distributionReadability",
  },
  {
    key: "maintainability",
    title: "Индекс ремонтопригодности",
    cardKey: "avgMI",
    tableKey: "top5Maintainability",
    chartKey: "distributionMaintainability",
  },
];
