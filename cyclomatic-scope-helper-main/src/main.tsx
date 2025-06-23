import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ConfigProvider } from "antd";
import ruRU from "antd/locale/ru_RU";
import "./index.css";
import "./app.css";
import { ANT_THEME } from "./config/ant-theme";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ConfigProvider theme={ANT_THEME} locale={ruRU}>
      <App />
    </ConfigProvider>
  </React.StrictMode>
);
