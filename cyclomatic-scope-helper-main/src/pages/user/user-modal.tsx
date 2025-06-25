import React, { useEffect, useState } from "react";
import {
  Modal,
  Typography,
  Space,
  Avatar,
  Tooltip,
  Row,
  Button,
  Col,
  message,
} from "antd";
import {
  UserOutlined,
  DownloadOutlined,
  RightOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import api from "@/shared/api/axios";
import CustomTable from "@/UI/table/custom-table";
import type { ColumnsType } from "antd/es/table";
import { useAuth } from "@/pages/auth/auth-context";
import "./user-modal.css";
import { API_BASE } from "@/shared/constants";

const { Title, Text } = Typography;

interface ApiHistoryItem {
  analysis_id: number;
  analysis_date: string;
  project_name: string;
  report_pdf: string;
}

interface RequestHistoryItem {
  key: number;
  date: string;
  filename: string;
  pdfLink: string;
}

interface UserProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

const columns: ColumnsType<RequestHistoryItem> = [
  {
    key: "filename",
    dataIndex: "filename",
    render: (text) => (
      <Space direction="vertical" size={4}>
        <Title level={5} className="user-modal-filename">
          <RightOutlined className="user-modal-filename-icon" />
          {text}
        </Title>
      </Space>
    ),
    width: "60%",
  },
  {
    key: "date",
    dataIndex: "date",
    render: (date) => <Text className="user-modal-date">{date}</Text>,
  },
  {
    key: "download",
    align: "right",
    width: 60,
    render: (_, record) => (
      <Tooltip title="Скачать отчет">
        <a
          href={record.pdfLink}
          target="_blank"
          rel="noopener noreferrer"
          className="user-modal-download-link"
        >
          <DownloadOutlined style={{ fontSize: 18, color: "#ffffffcc" }} />
        </a>
      </Tooltip>
    ),
  },
];

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  onClose,
}) => {
  const { logout, username, userId } = useAuth();
  const [history, setHistory] = useState<RequestHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !userId) return;

    setLoading(true);
    api
      .get<ApiHistoryItem[]>(`/history/${userId}`)
      .then(({ data }) => {
        setHistory(
          data.map((it) => ({
            key: it.analysis_id,
            date: new Date(it.analysis_date).toLocaleDateString(),
            filename: it.project_name,
            pdfLink: `${API_BASE}${it.report_pdf}`,
          }))
        );
      })
      .catch((err) => {
        console.error(err);
        message.error("Не удалось загрузить историю запросов");
      })
      .finally(() => setLoading(false));
  }, [visible, userId]);

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      centered
      width={600}
      className="user-modal"
      confirmLoading={loading}
    >
      <Row
        align="middle"
        justify="space-between"
        className="user-modal-header"
        gutter={16}
      >
        <Col>
          <Space align="center">
            <Avatar size={48} icon={<UserOutlined />} />
            <Text strong className="user-modal-username">
              {username}
            </Text>
          </Space>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            size="small"
            className="user-modal-logout-btn"
          >
            Выйти
          </Button>
        </Col>
      </Row>

      <div style={{ marginTop: 24 }}>
        <Title level={3} className="user-modal-history-title">
          История запросов
        </Title>
        <CustomTable
          dataSource={history}
          columns={columns}
          pagination={false}
          showHeader={false}
          rowKey="key"
          loading={loading}
        />
      </div>
    </Modal>
  );
};

export default UserProfileModal;
