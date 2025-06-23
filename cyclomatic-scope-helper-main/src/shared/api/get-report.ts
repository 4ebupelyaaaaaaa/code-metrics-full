// src/shared/api/get-report.ts
import axios from "axios";
import type { ReportPayload } from "@/utils/build-report-payload";

export interface AnalysisResponse {
  success: boolean;
  pdfUrl: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; //доделать
}

export async function fetchAnalysisReport(
  archive: File,
  options: ReportPayload
): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("archive", archive);
  formData.append("options", JSON.stringify(options));

  const { data } = await axios.post<AnalysisResponse>(
    "/api/report/report",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data;
}
