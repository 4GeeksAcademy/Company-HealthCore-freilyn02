import type { CandidateStatus, CandidateStage } from "@/types/candidate";

// Human-readable labels for the API's raw status/stage values.
// Centralized here so every page shows the exact same wording.
export const STATUS_LABELS: Record<CandidateStatus, string> = {
  received: "Received",
  in_progress: "In progress",
  selected: "Selected",
  discarded: "Discarded",
};

export const STAGE_LABELS: Record<CandidateStage, string> = {
  pending: "Pending review",
  review: "Under review",
  personal_interview: "Personal interview",
  technical_interview: "Technical interview",
  offer_presented: "Offer presented",
};

// Arrays of [value, label] pairs, handy for building <select> dropdowns.
export const STATUS_OPTIONS = Object.entries(STATUS_LABELS) as [
  CandidateStatus,
  string
][];

export const STAGE_OPTIONS = Object.entries(STAGE_LABELS) as [
  CandidateStage,
  string
][];