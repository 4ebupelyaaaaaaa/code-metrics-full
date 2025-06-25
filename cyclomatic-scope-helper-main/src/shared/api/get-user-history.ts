import api from "@/shared/api/axios";

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
  const response = await api.get(`/history/${userId}`);
  return response.data;
};
