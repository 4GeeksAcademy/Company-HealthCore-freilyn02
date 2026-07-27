import { apiFetch } from "./api";
import type {
  Candidate,
  CandidatesResponse,
  CandidateStatus,
  CandidateStage,
} from "@/types/candidate";

export interface GetCandidatesParams {
  status?: CandidateStatus;
  stage?: CandidateStage;
  search?: string;
  page?: number;
  limit?: number;
}

export async function getCandidates(
  params: GetCandidatesParams = {}
): Promise<CandidatesResponse> {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set("status", params.status);
  if (params.stage) searchParams.set("stage", params.stage);
  if (params.search) searchParams.set("search", params.search);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const queryString = searchParams.toString();
  const path = queryString ? `/records?${queryString}` : "/records";

  return apiFetch<CandidatesResponse>(path);
}

export async function getCandidateById(id: string): Promise<Candidate> {
  return apiFetch<Candidate>(`/records/${id}`);
}

export interface CreateCandidateInput {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  experience_years: number;
}

export async function createCandidate(
  input: CreateCandidateInput
): Promise<Candidate> {
  return apiFetch<Candidate>("/records", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type UpdateCandidateInput = CreateCandidateInput;

export async function updateCandidate(
  id: string,
  input: UpdateCandidateInput
): Promise<Candidate> {
  return apiFetch<Candidate>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export interface PatchCandidateInput {
  status?: CandidateStatus;
  stage?: CandidateStage;
}

export async function patchCandidate(
  id: string,
  input: PatchCandidateInput
): Promise<Candidate> {
  return apiFetch<Candidate>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}