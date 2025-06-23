import { Tag } from "antd";
import "./tag-outline.css";

interface TagOutlineProps {
  children: React.ReactNode;
  color?: "light" | "dark";
}

const TagOutline: React.FC<TagOutlineProps> = ({
  children,
  color = "dark",
}) => {
  return <Tag className={`tag-outline ${color}`}>{children}</Tag>;
};

export default TagOutline;
