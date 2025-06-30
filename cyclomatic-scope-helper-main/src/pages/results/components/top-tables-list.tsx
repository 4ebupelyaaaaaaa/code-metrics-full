import React from "react";
import CustomTable from "@/UI/table/custom-table";
import type { AnalysisResponse } from "@/shared/api/get-report";
import { metricLabels } from "../labels";
import "./top-tables-list.css";

type TableKey = keyof Pick<
  AnalysisResponse,
  | "top5Complexity"
  | "top5Cyclomatic"
  | "top5Comment"
  | "topDuplicates"
  | "top5Readability"
  | "top5Maintainability"
  | "top5Inheritance"
  | "top5Depth"
>;

interface Props {
  analysis: Partial<AnalysisResponse>;
}

const allKeys: TableKey[] = [
  "top5Complexity",
  "top5Cyclomatic",
  "top5Comment",
  "topDuplicates",
  "top5Readability",
  "top5Maintainability",
  "top5Inheritance",
  "top5Depth",
];

const TopTablesList: React.FC<Props> = ({ analysis }) => {
  return (
    <div className="tables-list">
      {allKeys.map((key) => {
        const data = Array.isArray(analysis[key])
          ? (analysis[key] as any[])
          : [];
        if (!data.length) return null;

        const columns = Object.keys(data[0]).map((f) => ({
          title: f,
          dataIndex: f,
          key: f,
        }));

        return (
          <div className="table-block" key={key}>
            <h2 className="table-label">{metricLabels[key]}</h2>
            <CustomTable
              dataSource={data}
              columns={columns}
              pagination={false}
              rowKey={(_r, i) => `${key}-${i}`}
            />
          </div>
        );
      })}
    </div>
  );
};

export default TopTablesList;
