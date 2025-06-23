import React from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import Toolbar from "@/UI/toolbar";
import "./styles.css";

const { Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  return (
    <Layout className="layout">
      <Toolbar />
      <Content className="content">
        <Outlet />
      </Content>
      <Footer className="footer">
        CodeMetrics ©2025 Created by Students 1247
      </Footer>
    </Layout>
  );
};

export default MainLayout;
