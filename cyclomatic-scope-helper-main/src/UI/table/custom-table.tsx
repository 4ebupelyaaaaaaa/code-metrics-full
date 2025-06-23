import { Table, TableProps } from "antd";
import "./custom-table.css";

const CustomTable = <T extends object>(props: TableProps<T>) => {
  const shouldScroll = (props.dataSource?.length || 0) > 4;

  return (
    <div className="custom-table-wrapper">
      <Table {...props} scroll={shouldScroll ? { y: 240 } : undefined} />
    </div>
  );
};

export default CustomTable;
