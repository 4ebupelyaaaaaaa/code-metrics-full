import React, { ReactNode } from "react";
import { Card as AntCard } from "antd";
import "./metrics-card.css";

interface CardProps {
  children: ReactNode;
}

const MetricsCard: React.FC<CardProps> = ({ children }) => {
  return (
    <AntCard className="custom-card">
      <div className="card-content">{children}</div>
    </AntCard>
  );
};

export default MetricsCard;
