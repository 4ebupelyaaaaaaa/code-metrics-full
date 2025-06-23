// src/pages/results/ResultsPage.tsx
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Button } from "antd";
import type { AnalysisResponse } from "@/shared/api/get-report";
import InfoCardList from "./components/info-card-list";
import TopTablesList from "./components/top-tables-list";
import DistributionChartsList from "./components/distribution-charts-list";
import { sections } from "./sections";
import "./results-page.css";
import InfoCard from "@/UI/info-card/info-card";

export default function ResultsPage() {
  const { state } = useLocation();
  const analysis = state?.analysis as AnalysisResponse;
  const pdfUrl = analysis?.pdfUrl && `http://localhost:5000${analysis.pdfUrl}`;
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    if (!pdfUrl) return;
    setDownloading(true);
    try {
      const resp = await fetch(pdfUrl);
      const blob = await resp.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "report.pdf";
      link.click();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="results-wrapper">
      {sections.map((sec) => {
        // Поддерживаем как старый cardKey, так и новый cardKeys
        const cardKeys: Array<keyof AnalysisResponse> =
          (sec.cardKeys as Array<keyof AnalysisResponse>) ||
          (sec.cardKey ? [sec.cardKey] : []);

        // отфильтровываем ключи, для которых есть данные
        const availableCards = cardKeys.filter((key) => analysis[key] != null);
        const hasCard = availableCards.length > 0;

        const hasTable =
          !!sec.tableKey &&
          Array.isArray(analysis[sec.tableKey]) &&
          (analysis[sec.tableKey] as any[]).length > 0;
        const hasChart =
          !!sec.chartKey &&
          Array.isArray(analysis[sec.chartKey]) &&
          (analysis[sec.chartKey] as any[]).length > 0;

        if (!hasCard && !hasTable && !hasChart) return null;

        return (
          <section className="results-section" key={sec.key}>
            <div className="section-header">
              <h1 className="gradient-title-result">{sec.title}</h1>

              {hasCard && (
                <div className="section-card">
                  <InfoCardList
                    analysis={availableCards.reduce((acc, key) => {
                      acc[key] = analysis[key];
                      return acc;
                    }, {} as Partial<AnalysisResponse>)}
                  />
                </div>
              )}
            </div>

            {(hasTable || hasChart) && (
              <div className="section-content">
                {hasTable && sec.tableKey && (
                  <div className="section-table">
                    <InfoCard>
                      <TopTablesList
                        analysis={{ [sec.tableKey]: analysis[sec.tableKey] }}
                      />
                    </InfoCard>
                  </div>
                )}

                {hasChart && sec.chartKey && (
                  <div className="section-chart">
                    <InfoCard>
                      <DistributionChartsList
                        analysis={{ [sec.chartKey]: analysis[sec.chartKey] }}
                      />
                    </InfoCard>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}

      {pdfUrl && (
        <div className="download-button">
          <Button type="primary" loading={downloading} onClick={download}>
            Скачать PDF
          </Button>
        </div>
      )}
    </div>
  );
}
