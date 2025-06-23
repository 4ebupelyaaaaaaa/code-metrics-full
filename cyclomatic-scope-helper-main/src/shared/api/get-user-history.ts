import axios from "axios";

export interface HistoryItem {
  analysis_id: number;
  user_id: number;
  analysis_date: string;
  project_name: string;
  report_pdf: string;
  user: {
    id: number;
    login: string;
  };
}

export const getUserHistory = async (
  userId: number
): Promise<HistoryItem[]> => {
  const response = await axios.get(
    `http://localhost:5000/api/history/${userId}`
  );
  return response.data;
};
