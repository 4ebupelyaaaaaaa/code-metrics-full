import React from "react";
import { Layout, Button, Tooltip } from "antd";
import { GiftOutlined } from "@ant-design/icons";
import { Outlet } from "react-router-dom";
import Toolbar from "@/UI/toolbar";
import "./styles.css";

const { Content, Footer } = Layout;

const TIP_URL = "https://pay.cloudtips.ru/p/83c591cd";

const MainLayout: React.FC = () => {
  return (
    <Layout className="layout">
      <Toolbar />
      <Content className="content">
        <Outlet />
      </Content>

      <Footer className="footer">
        <div className="footer-left">
          CodeMetrics ©2025 Created by Students 1247
        </div>

        <div className="footer-right">
          <Tooltip title="Поддержать проект — спасибо!">
            <a
              href={TIP_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Поддержать проект — чаевые"
            >
              <Button
                type="default"
                className="tip-button"
                icon={<GiftOutlined />}
                size="middle"
              >
                Спасибо
              </Button>
            </a>
          </Tooltip>
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
