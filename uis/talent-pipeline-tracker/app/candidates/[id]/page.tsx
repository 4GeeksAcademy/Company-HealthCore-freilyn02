"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCandidateById, patchCandidate } from "@/services/candidates";
import { createNote, deleteNote, getNotes } from "@/services/notes";
import { ApiError } from "@/services/api";
import { STATUS_LABELS, STAGE_LABELS, STATUS_OPTIONS, STAGE_OPTIONS } from "@/lib/labels";
import type { Candidate, CandidateStatus, CandidateStage, Note } from "@/types/candidate";

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  async function loadCandidate() {
    setLoading(true);
    setError(null);
    try {
      const data = await getCandidateById(params.id);
      setCandidate(data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong while loading this candidate.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadNotes() {
    try {
      const response = await getNotes(params.id);
      setNotes(response.data);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong while loading notes.";
      setNotesError(message);
    }
  }

  useEffect(() => {
    loadCandidate();
    loadNotes();
  }, [params.id]);

  async function handlePatch(update: { status?: CandidateStatus; stage?: CandidateStage }) {
    if (!candidate) return;
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await patchCandidate(candidate.id, update);
      setCandidate(updated);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong while saving this change.";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote() {
    if (!candidate || !newNoteContent.trim()) return;
    setNotesSaving(true);
    setNotesError(null);
    try {
      await createNote(candidate.id, { content: newNoteContent.trim() });
      setNewNoteContent("");
      await loadNotes();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong while adding this note.";
      setNotesError(message);
    } finally {
      setNotesSaving(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!candidate) return;
    setNotesSaving(true);
    setNotesError(null);
    try {
      await deleteNote(candidate.id, noteId);
      await loadNotes();
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong while deleting this note.";
      setNotesError(message);
    } finally {
      setNotesSaving(false);
    }
  }

  if (loading) {
    return <p className="text-[#5f5a54]">Loading candidate...</p>;
  }

  if (error) {
    return <p className="font-semibold text-[#b3261e]">Error: {error}</p>;
  }

  if (!candidate) {
    return <p className="text-[#5f5a54]">Candidate not found.</p>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-4 flex gap-4">
        <button onClick={() => router.push("/")} className="font-semibold text-[#ff6a3d] hover:underline">
          Back to list
        </button>
        <button onClick={() => router.push(`/candidates/${candidate.id}/edit`)} className="font-semibold text-[#ff6a3d] hover:underline">
          Edit data
        </button>
      </div>

      <h1 className="mb-1 font-[family-name:var(--font-space-grotesk)] text-2xl tracking-[-0.03em]">{candidate.full_name}</h1>
      <p className="mb-6 text-[#5f5a54]">{candidate.position}</p>

      <div className="mb-6 flex gap-4">
        <div>
          <label className="mb-1 block text-sm text-[#5f5a54]">Status</label>
          <select
            value={candidate.status}
            disabled={saving}
            onChange={(e) => handlePatch({ status: e.target.value as CandidateStatus })}
            className="rounded-xl border border-[rgba(16,16,16,0.14)] bg-white px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
          >
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5f5a54]">Stage</label>
          <select
            value={candidate.stage}
            disabled={saving}
            onChange={(e) => handlePatch({ stage: e.target.value as CandidateStage })}
            className="rounded-xl border border-[rgba(16,16,16,0.14)] bg-white px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
          >
            {STAGE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {saving && <p className="mb-4 text-sm text-[#5f5a54]">Saving...</p>}
      {saveError && <p className="mb-4 text-sm font-semibold text-[#b3261e]">Error: {saveError}</p>}

      <dl className="mb-8 grid grid-cols-2 gap-y-3 rounded-[28px] border border-[rgba(16,16,16,0.06)] bg-white p-6 shadow-[0_14px_30px_rgba(16,16,16,0.05)]">
        <dt className="text-[#5f5a54]">Email</dt>
        <dd>{candidate.email}</dd>

        <dt className="text-[#5f5a54]">Phone</dt>
        <dd>{candidate.phone}</dd>

        <dt className="text-[#5f5a54]">LinkedIn</dt>
        <dd>
          {candidate.linkedin_url === null ? "No LinkedIn provided" : <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#ff6a3d] hover:underline">View profile</a>}
        </dd>

        <dt className="text-[#5f5a54]">CV</dt>
        <dd>
          <a href={candidate.cv_url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#ff6a3d] hover:underline">View CV</a>
        </dd>

        <dt className="text-[#5f5a54]">Years of experience</dt>
        <dd>{candidate.experience_years}</dd>

        <dt className="text-[#5f5a54]">Applied on</dt>
        <dd>{new Date(candidate.applied_at).toLocaleDateString()}</dd>
      </dl>

      <section>
        <h2 className="mb-3 font-[family-name:var(--font-space-grotesk)] text-lg">Internal notes</h2>

        <div className="mb-4 flex gap-2">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Add a note after a call or interview..."
            disabled={notesSaving}
            className="flex-1 rounded-xl border border-[rgba(16,16,16,0.14)] bg-white px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
            rows={2}
          />
          <button
            onClick={handleAddNote}
            disabled={notesSaving || !newNoteContent.trim()}
            className="self-start rounded-full bg-[#ff6a3d] px-5 py-2 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#e4542c] disabled:opacity-50"
          >
            Add
          </button>
        </div>

        {notesError && <p className="mb-4 text-sm font-semibold text-[#b3261e]">Error: {notesError}</p>}

        {notes.length === 0 ? (
          <p className="text-[#5f5a54]">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="flex items-start justify-between gap-3 rounded-[20px] border border-[rgba(16,16,16,0.06)] bg-white p-4">
                <div>
                  <p>{note.content}</p>
                  <p className="mt-1 text-xs text-[#5f5a54]">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  disabled={notesSaving}
                  className="shrink-0 text-sm font-semibold text-[#b3261e] hover:underline"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}