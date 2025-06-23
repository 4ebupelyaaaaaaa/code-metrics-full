import React from "react";
import { Card, Col, Row, Space, Typography } from "antd";
import MetricsSelectionCard from "./metrics-selection/metrics-selection";
import "./home.css";
import { RightOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

const Home: React.FC = () => {
  return (
    <div className="home-wrapper">
      <img src="/main.svg" className="bg-shape left" alt="left bg" />
      <img src="/main-bt.svg" className="bg-shape right" alt="right bg" />

      <div className="home-container">
        <header className="hero-section">
          <h1 className="gradient-title">
            Автоматизированная платформа оценки программного обеспечения
          </h1>
          <Paragraph className="subtitle">от кода к результатам</Paragraph>
        </header>

        <MetricsSelectionCard />

        <Row justify="start" style={{ marginTop: 60 }}>
          <Col xs={24} md={14} lg={12} xl={10}>
            <Title level={1}>Все возможности</Title>
            <Card className="transparent text-left">
              <Space
                direction="vertical"
                size="large"
                style={{ width: "100%" }}
              >
                <div>
                  <Title level={4}>
                    <RightOutlined style={{ marginRight: 8 }} />
                    Оценка сложности кода
                  </Title>
                  <Paragraph>
                    Определение сложности тестирования и поддержки через анализ
                    логики и ветвлений, выявление сложных участков кода для
                    упрощения, базовый показатель объема работы и потенциальных
                    проблем.
                  </Paragraph>
                </div>

                <div>
                  <Title level={4}>
                    <RightOutlined style={{ marginRight: 8 }} />
                    Оценка качества кода
                  </Title>
                  <Paragraph>
                    Расчет доли кода, протестированной модульными или
                    интеграционными тестами, автоматическая проверка понятности
                    кода для других разработчиков, проверка наличия и качества
                    пояснений к коду.
                  </Paragraph>
                </div>

                <div>
                  <Title level={4}>
                    <RightOutlined style={{ marginRight: 8 }} />
                    Интеграция с процессом разработки
                  </Title>
                  <Paragraph>
                    Подключение к системам контроля версий (Git, SVN) — анализ
                    изменений в коде в реальном времени, автоматическое создание
                    PDF- или HTML-отчетов по метрикам.
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Home;
