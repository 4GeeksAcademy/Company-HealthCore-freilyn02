export interface AnalysisSummary {
  total_records: number;
  valid_records: number;
  invalid_records: number;
  invalid_by_reason: Record<string, number>;
  category_breakdown: Record<string, number>;
  status_breakdown: Record<string, number>;
  satisfaction: {
    scored_closed_count: number;
    average_score: number | null;
    distribution: Record<string, number>;
  };
}

export interface ApiErrorResponse {
  detail: string;
}
