import React, { ReactNode } from "react";
import { Card as AntCard } from "antd";
import "./info-card.css";

interface CardProps {
  children: ReactNode;
}

const InfoCard: React.FC<CardProps> = ({ children }) => {
  return (
    <AntCard variant="borderless" className="custom-card">
      <div className="card-content">{children}</div>
    </AntCard>
  );
};

export default InfoCard;
