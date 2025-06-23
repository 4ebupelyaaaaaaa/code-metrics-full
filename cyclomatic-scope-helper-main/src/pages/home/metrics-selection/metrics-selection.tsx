import React, { useState } from "react";
import { Button, Card, Col, Row, Tabs, Upload, message, Spin } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import TagOutline from "@/UI/tag-outline";
import { RcFile } from "antd/es/upload";
import { useNavigate } from "react-router-dom";
import { fetchAnalysisReport } from "@/shared/api/get-report";
import { buildReportPayload } from "@/utils/build-report-payload";
import { useAuth } from "@/pages/auth/auth-context";
import { saveToHistory } from "@/shared/api/save-to-history";

const { TabPane } = Tabs;

const reportOptions: Record<string, Record<string, string[]>> = {
  Сложность: {
    "Цикломатическая сложность": [
      "Среднее значение сложности по проекту",
      "Функции с высокой цикломатической сложностью",
      "Распределение сложности",
    ],
    "Глубина вложенности": [
      "Максимальная глубина вложенности",
      "Список функций с превышением допустимой глубины",
      "Распределение вложенности",
    ],
    "Когнитивная сложность": [
      "Среднее значение когнитивной сложности",
      "Функции с высокой когнитивной сложностью",
      "Распределение когнитивной сложности",
    ],
    "Глубина наследования": [
      "Максимальная глубина наследования",
      "Классы с глубокой иерархией",
      "Распределение глубины наследования",
    ],
  },
  Качество: {
    "Дублирование кода": [
      "Количество дублирующихся строк",
      "Список мест, где найдено дублирование",
      "Процент дублирования",
    ],
    "Индекс ремонтопригодности": [
      "Индекс ремонтопригодности MI",
      "Файлы с низкой ремонтопригодностью",
      "Распределение ремонтопригодности",
    ],
    "Коэффициент комментариев": [
      "Общий процент комментариев",
      "Файлы с наименьшим количеством комментариев",
      "Распределение комментариев",
    ],
    "Читабельность кода": [
      "Среднее значение читабельности",
      "Функции с низкой читабельностью",
      "Распределение читабельности по файлам",
    ],
  },
};

const MetricsSelectionCard: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [selectedTab, setSelectedTab] = useState("Сложность");
  const [selectedMetric, setSelectedMetric] = useState(
    Object.keys(reportOptions.Сложность)[0]
  );
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleReport = (report: string) => {
    setSelectedReports((prev) =>
      prev.includes(report)
        ? prev.filter((r) => r !== report)
        : [...prev, report]
    );
  };

  const selectAllReports = () => {
    const allReports: string[] = [];

    Object.values(reportOptions).forEach((category) => {
      Object.values(category).forEach((reports) => {
        allReports.push(...reports);
      });
    });

    const allSelected = allReports.every((r) => selectedReports.includes(r));

    if (allSelected) {
      setSelectedReports([]);
    } else {
      setSelectedReports(
        Array.from(new Set([...selectedReports, ...allReports]))
      );
    }
  };

  const handleFile = async (file: RcFile) => {
    setLoading(true);
    try {
      const payload = buildReportPayload(selectedReports);
      const result = await fetchAnalysisReport(file, payload);

      if (userId && result.pdfUrl) {
        await saveToHistory(userId, {
          project_name: file.name,
          analysis_date: new Date().toISOString(),
          report_pdf: `http://localhost:5000${result.pdfUrl}`,
        });
      }

      navigate("/results", {
        state: { analysis: result, selectedReports },
      });
      message.success("Файл успешно проанализирован.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const serverError =
        error.response?.data?.error ?? "Ошибка при анализе файла";
      message.error(serverError);
      console.error("Ошибка при анализе файла:", error);
    } finally {
      setLoading(false);
    }

    return false;
  };

  const allReports: string[] = [];
  Object.values(reportOptions).forEach((cat) =>
    Object.values(cat).forEach((reports) => allReports.push(...reports))
  );
  const allSelected = allReports.every((r) => selectedReports.includes(r));

  return (
    <Row justify="center">
      <Col xs={24} xl={30} xxl={18}>
        <Card className="custom-border">
          <Row gutter={[24, 24]} align="stretch">
            <Col xs={24} md={12}>
              <Card className="transparent" style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    width: "100%",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    onClick={selectAllReports}
                    style={{
                      whiteSpace: "nowrap",
                      width: "fit-content",
                      minWidth: 80,
                      fontSize: 18,
                    }}
                  >
                    {allSelected ? "Сбросить всё" : "Выбрать все"}
                  </Button>
                  <TagOutline color="dark">Выбор метрик</TagOutline>
                </div>

                <Tabs
                  activeKey={selectedTab}
                  onChange={(key) => {
                    setSelectedTab(key);
                    const firstMetric = Object.keys(reportOptions[key])[0];
                    setSelectedMetric(firstMetric);
                  }}
                >
                  {Object.entries(reportOptions).map(([category, metrics]) => (
                    <TabPane tab={category} key={category}>
                      {Object.keys(metrics).map((metric) => (
                        <Button
                          key={metric}
                          className={`metric-btn ${
                            selectedMetric === metric ? "active" : ""
                          }`}
                          type="default"
                          onClick={() => setSelectedMetric(metric)}
                          block
                          style={{ marginBottom: 8 }}
                        >
                          {metric}
                        </Button>
                      ))}
                    </TabPane>
                  ))}
                </Tabs>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  height: "100%",
                }}
              >
                <Upload
                  beforeUpload={handleFile}
                  showUploadList={false}
                  accept=".js,.ts,.tsx,.zip,.py"
                  disabled={loading}
                >
                  <Button
                    icon={<UploadOutlined />}
                    type="primary"
                    block
                    loading={loading}
                  >
                    Загрузить код
                  </Button>
                </Upload>

                <Card className="transparent" style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginBottom: 16,
                    }}
                  >
                    <TagOutline color="light">Содержание отчета</TagOutline>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                    }}
                  >
                    {reportOptions[selectedTab][selectedMetric].map(
                      (report) => (
                        <Button
                          key={report}
                          type="primary"
                          block
                          className={
                            selectedReports.includes(report) ? "active" : ""
                          }
                          onClick={() => toggleReport(report)}
                          disabled={loading}
                        >
                          {report}
                        </Button>
                      )
                    )}
                  </div>
                </Card>
              </div>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );
};

export default MetricsSelectionCard;
