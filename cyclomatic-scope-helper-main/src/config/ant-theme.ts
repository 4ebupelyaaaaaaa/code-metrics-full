import { ThemeConfig } from "antd";

export const ANT_THEME: ThemeConfig = {
  token: {
    colorPrimary: "var(--color-primary)",
    borderRadius: 25,
    colorText: "var(--color-text)",
    colorBgBase: "var(--color-bg-primary)",
  },
  components: {
    Button: {
      borderRadius: 25,
      defaultHoverBg: "#9ddce5",
      colorPrimary: "#191b4a",
      colorPrimaryHover: "#ffffff",
      colorPrimaryActive: "#ffffff",
      fontWeight: 400,
      fontSize: 24,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 30,
      padding: 20,
    },
    Layout: {
      colorBgHeader: "transparent",
      colorBgBody: "var(--color-bg-primary)",
      colorText: "var(--color-text)",
    },
  },
};
