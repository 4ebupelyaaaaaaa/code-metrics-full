import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout, Button, Row, Col, Space } from "antd";
import { UserOutlined } from "@ant-design/icons";
import "./toolbar.css";
import UserProfileModal from "@/pages/user/user-modal";
import { useAuth } from "@/pages/auth/auth-context";

const { Header } = Layout;

const Toolbar: React.FC = () => {
  const navigate = useNavigate();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <Header className="toolbar-header">
      <Row justify="space-between" align="middle">
        <Col>
          <img
            src="/logo.svg"
            alt="Logo"
            className="toolbar-logo"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          />
        </Col>
        <Col>
          <Space size="large">
            {!isAuthenticated ? (
              <Button
                type="link"
                className="toolbar-login"
                onClick={() => navigate("/auth")}
              >
                Войти
              </Button>
            ) : (
              <Button
                icon={<UserOutlined />}
                type="text"
                className="toolbar-user-icon"
                onClick={() => setIsModalVisible(true)}
              />
            )}
          </Space>
        </Col>
      </Row>
      <UserProfileModal
        visible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
      />
    </Header>
  );
};

export default Toolbar;
