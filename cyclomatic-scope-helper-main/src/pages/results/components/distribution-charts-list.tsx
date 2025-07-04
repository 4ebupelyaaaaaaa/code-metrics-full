import React from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import type { AnalysisResponse } from "@/shared/api/get-report";
import { metricLabels } from "../labels";
import "./distribution-charts-list.css";

type ChartKey = keyof Pick<
  AnalysisResponse,
  | "distributionComplexity"
  | "distributionCyclomatic"
  | "distributionComment"
  | "distributionReadability"
  | "distributionMaintainability"
  | "distributionInheritance"
  | "distributionDepth"
>;

interface Props {
  analysis: Partial<AnalysisResponse>;
}

const allKeys: ChartKey[] = [
  "distributionComplexity",
  "distributionCyclomatic",
  "distributionComment",
  "distributionReadability",
  "distributionMaintainability",
  "distributionInheritance",
  "distributionDepth",
];

const DistributionChartsList: React.FC<Props> = ({ analysis }) => {
  return (
    <div className="charts-list">
      {allKeys.map((key) => {
        const data = Array.isArray(analysis[key])
          ? (analysis[key] as any[])
          : [];
        if (!data.length) return null;

        const valueField = Object.keys(data[0]).find(
          (f) => typeof data[0][f] === "number"
        )!;
        const categoryField = Object.keys(data[0]).find(
          (f) => f !== valueField
        )!;

        const options: Highcharts.Options = {
          chart: {
            type: "column",
            backgroundColor: "rgba(255, 255, 255, 0.0)",
            borderRadius: 16,
            height: 300,
          },
          title: {
            text: undefined,
            margin: 0,
          },
          xAxis: {
            categories: data.map((d) => String(d[valueField])),
            labels: { style: { color: "#fff" } },
            lineColor: "#fff",
          },
          yAxis: {
            title: {
              text: "Количество файлов/функций",
              style: { color: "#fff" },
            },
            labels: { style: { color: "#fff" } },
            gridLineColor: "rgba(255,255,255,0.2)",
          },
          tooltip: {
            backgroundColor: "rgba(0,0,0,0.85)",
            borderRadius: 6,
            style: { color: "#fff" },
            headerFormat:
              '<span style="font-size: 13px;"><b>' +
              metricLabels[key] +
              ": {point.key}</b></span><br/>",
            pointFormat:
              '<span style="font-size: 12px;">Количество файлов/функций: <b>{point.y}</b></span>',
            useHTML: true,
          },
          legend: {
            itemStyle: {
              color: "#fff",
            },
          },
          series: [
            {
              name: metricLabels[key],
              data: data.map((d) => Number(d[categoryField])),
            },
          ] as Highcharts.SeriesOptionsType[],
          credits: { enabled: false },
        };

        return (
          <div className="chart-block" key={key}>
            <h2 className="chart-label">{metricLabels[key]}</h2>
            <HighchartsReact highcharts={Highcharts} options={options} />
          </div>
        );
      })}
    </div>
  );
};

export default DistributionChartsList;
