import { apiFetch } from "./api";
import type { Note, NotesResponse } from "@/types/candidate";

// GET /records/:id/notes — fetch all notes for a candidate.
export async function getNotes(candidateId: string): Promise<NotesResponse> {
  return apiFetch<NotesResponse>(`/records/${candidateId}/notes`);
}

// POST /records/:id/notes — add a new note to a candidate.
export interface CreateNoteInput {
  content: string;
}

export async function createNote(
  candidateId: string,
  input: CreateNoteInput
): Promise<Note> {
  return apiFetch<Note>(`/records/${candidateId}/notes`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

// DELETE /records/:id/notes/:note_id — remove a note from a candidate.
export async function deleteNote(
  candidateId: string,
  noteId: string
): Promise<void> {
  return apiFetch<void>(`/records/${candidateId}/notes/${noteId}`, {
    method: "DELETE",
  });
}