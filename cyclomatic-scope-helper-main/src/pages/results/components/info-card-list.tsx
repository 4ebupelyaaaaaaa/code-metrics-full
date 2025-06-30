import React from "react";
import InfoCard from "@/UI/info-card/info-card";
import TagOutline from "@/UI/tag-outline";
import type { AnalysisResponse } from "@/shared/api/get-report";
import { metricLabels } from "../labels";
import {
  metricThresholds,
  ThresholdConfig,
  Better,
} from "../metric-thresholds";
import "./info-card-list.css";

type CardKey = keyof Pick<
  AnalysisResponse,
  | "avgComplexity"
  | "avgCyclomatic"
  | "commentRatio"
  | "duplicatedLines"
  | "duplicationPercentage"
  | "avgReadability"
  | "avgMI"
  | "maxInheritance"
  | "maxDepth"
>;

interface Props {
  analysis: Partial<AnalysisResponse>;
}

function getColorClass(
  cfg: ThresholdConfig | undefined,
  value: number
): "green" | "yellow" | "red" {
  if (!cfg?.numeric) return "green";
  const { green, yellow } = cfg.numeric;
  const mode: Better = cfg.better || "lower";
  if (mode === "higher") {
    if (value >= green) return "green";
    if (value >= yellow) return "yellow";
    return "red";
  }
  if (value <= green) return "green";
  if (value <= yellow) return "yellow";
  return "red";
}

const allKeys: CardKey[] = [
  "avgComplexity",
  "avgCyclomatic",
  "commentRatio",
  "duplicatedLines",
  "duplicationPercentage",
  "avgReadability",
  "avgMI",
  "maxInheritance",
  "maxDepth",
];

const InfoCardList: React.FC<Props> = ({ analysis }) => {
  const availableKeys = allKeys.filter((key) => analysis[key] != null);
  const multiple = availableKeys.length > 1;

  return (
    <div className={`card-list${multiple ? " multiple" : ""}`}>
      {availableKeys.map((key) => {
        const raw = analysis[key]!;
        const cfg = metricThresholds[key];
        const isNum = typeof raw === "number";
        const color = isNum ? getColorClass(cfg, raw as number) : "green";

        return (
          <div className="card-block" key={key}>
            <InfoCard>
              <TagOutline>{metricLabels[key]}</TagOutline>
              <div className={`metric-value ${color}`}>
                {isNum ? (raw as number).toLocaleString() : (raw as string)}
              </div>
              {cfg?.description && (
                <div className="metric-desc">{cfg.description}</div>
              )}
            </InfoCard>
          </div>
        );
      })}
    </div>
  );
};

export default InfoCardList;
