export type CandidateStatus = "received" | "in_progress" | "selected" | "discarded";

export type CandidateStage =
  | "pending"
  | "review"
  | "personal_interview"
  | "technical_interview"
  | "offer_presented";

export interface Note {
  id: string;
  record_id: string;
  content: string;
  created_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string;
  status: CandidateStatus;
  stage: CandidateStage;
  experience_years: number;
  applied_at: string;
  updated_at: string;
  notes_count: number;
}

export interface CandidatesResponse {
  total: number;
  page: number;
  limit: number;
  data: Candidate[];
}

export interface NotesResponse {
  data: Note[];
  meta: {
    total: number;
  };
}