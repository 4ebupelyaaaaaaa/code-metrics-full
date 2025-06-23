import axios from "axios";

export interface HistoryRecord {
  project_name: string;
  analysis_date: string;
  report_pdf: string;
}

export const saveToHistory = async (
  userId: number,
  data: HistoryRecord
): Promise<void> => {
  await axios.post(`/api/history/${userId}`, data);
};
