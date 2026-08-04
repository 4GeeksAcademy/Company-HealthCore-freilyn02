import { AnalysisSummary, ApiErrorResponse } from "@/types/incident-analysis";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function analyzeIncidents(file: File): Promise<AnalysisSummary> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_URL}/api/incidents/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorBody: ApiErrorResponse = await response.json();
    throw new Error(errorBody.detail || "Failed to analyze the file.");
  }

  return response.json();
}

export function getExportUrl(): string {
  return `${API_URL}/api/incidents/results/export`;
}
