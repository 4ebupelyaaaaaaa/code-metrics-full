import React from "react";
import { useNavigate } from "react-router-dom";
import { Card, Form, Input, Button, Typography, Layout, message } from "antd";
import {
  LockOutlined,
  UserOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import "./auth-page.css";
import api from "@/shared/api/axios";
import { useAuth } from "./auth-context";
import { usernameRules, passwordRules } from "@/utils/validation-rules";

const { Title } = Typography;
const { Content } = Layout;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values: { username: string; password: string }) => {
    try {
      const payload = {
        login: values.username,
        password: values.password,
      };
      const response = await api.post("/auth/register", payload);
      login(response.data.token);
      navigate("/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const msg =
        error.response?.data?.error ||
        "Ошибка при регистрации. Попробуйте позже.";
      message.error(msg); // ✅ отобразить ошибку пользователю
    }
  };

  return (
    <Layout className="login-layout">
      <img src="/logo.svg" alt="Logo" className="login-logo" />

      <Content className="login-content">
        <Card className="login-card">
          <div className="login-header">
            <button
              className="login-back-icon"
              onClick={() => navigate("/")}
              aria-label="Назад"
            >
              <ArrowLeftOutlined />
            </button>
            <Title level={3} className="login-title">
              Регистрация
            </Title>
          </div>

          <Form
            name="register"
            onFinish={onFinish}
            layout="vertical"
            requiredMark={false}
          >
            {/* Поле «Логин» */}
            <Form.Item name="username" rules={usernameRules}>
              <Input
                size="large"
                prefix={<UserOutlined />}
                placeholder="Логин"
              />
            </Form.Item>

            {/* Поле «Пароль» */}
            <Form.Item name="password" rules={passwordRules}>
              <Input.Password
                size="large"
                prefix={<LockOutlined />}
                placeholder="Пароль"
              />
            </Form.Item>

            <Form.Item>
              <Button htmlType="submit" type="default" block>
                Зарегистрироваться
              </Button>
            </Form.Item>

            <Form.Item>
              <Button type="primary" block onClick={() => navigate("/auth")}>
                Войти
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default RegisterPage;
