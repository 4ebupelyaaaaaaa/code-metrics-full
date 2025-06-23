export type Better = "higher" | "lower";

export interface ThresholdConfig {
  numeric?: { green: number; yellow: number };
  description?: string;
  better?: Better;
}

export const metricThresholds: Record<string, ThresholdConfig> = {
  avgCyclomatic: {
    numeric: { green: 10, yellow: 20 },
    description: "Рекомендуется не выше 10",
    better: "lower",
  },
  avgComplexity: {
    numeric: { green: 15, yellow: 30 },
    description: "Рекомендуется не выше 15",
    better: "lower",
  },
  maxDepth: {
    numeric: { green: 3, yellow: 6 },
    description: "Рекомендуется не глубже 3 уровней",
    better: "lower",
  },
  maxInheritance: {
    numeric: { green: 1, yellow: 3 },
    description: "Рекомендуется не глубже 3 уровней",
    better: "lower",
  },
  duplicationPercentage: {
    numeric: { green: 5, yellow: 15 },
    description: "Оптимально ниже 10%",
    better: "lower",
  },
  duplicatedLines: {
    description: "Рекомендуется минимизировать",
  },

  commentRatio: {
    numeric: { green: 30, yellow: 20 },
    description: "Рекомендуется более 20%",
    better: "higher",
  },
  avgReadability: {
    numeric: { green: 80, yellow: 50 },
    description: "Чем выше, тем лучше",
    better: "higher",
  },
  avgMI: {
    numeric: { green: 85, yellow: 65 },
    description: "Хорошо от 70 и выше",
    better: "higher",
  },
};
