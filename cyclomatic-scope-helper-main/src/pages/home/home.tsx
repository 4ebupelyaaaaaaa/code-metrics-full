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
                    Определяйте потенциально сложные для поддержки участки
                    вашего кода с помощью автоматического анализа логики и
                    ветвлений. Наша система выявляет те части кода, которые
                    могут потребовать больше внимания или стать источником
                    ошибок. Вы получите чёткое представление об объёме работы по
                    доработке и сможете заранее оценить риски проекта.
                  </Paragraph>
                </div>

                <div>
                  <Title level={4}>
                    <RightOutlined style={{ marginRight: 8 }} />
                    Оценка качества кода
                  </Title>
                  <Paragraph>
                    Получайте детальную картину качества вашей кодовой базы. Мы
                    рассчитываем дублирование кода, автоматически проверяем его
                    понятность для других разработчиков и оцениваем наличие и
                    качество комментариев. Эти метрики помогут вам поддерживать
                    высокие стандарты разработки.
                  </Paragraph>
                </div>

                <div>
                  <Title level={4}>
                    <RightOutlined style={{ marginRight: 8 }} />
                    Комплексная диагностика кода
                  </Title>
                  <Paragraph>
                    Ваш проект заслуживает глубокого понимания состояния кода.
                    Наша система предоставляет комплексный взгляд на ваш код,
                    объединяя метрики сложности и качества в единый, интуитивно
                    понятный отчёт.
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
