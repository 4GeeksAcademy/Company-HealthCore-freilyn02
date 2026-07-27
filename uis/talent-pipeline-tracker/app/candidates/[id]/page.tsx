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
    return <p className="p-6">Loading candidate...</p>;
  }

  if (error) {
    return <p className="p-6 text-red-600">Error: {error}</p>;
  }

  if (!candidate) {
    return <p className="p-6">Candidate not found.</p>;
  }

  return (
    <main className="p-6 max-w-2xl">
      <button onClick={() => router.push("/")} className="text-blue-600 hover:underline mb-4">
        Back to list
      </button>
      <button onClick={() => router.push(`/candidates/${candidate.id}/edit`)} className="text-blue-600 hover:underline mb-4 ml-4">
        Edit data
      </button>

      <h1 className="text-2xl font-bold mb-1">{candidate.full_name}</h1>
      <p className="text-gray-600 mb-6">{candidate.position}</p>

      <div className="flex gap-4 mb-6">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Status</label>
          <select
            value={candidate.status}
            disabled={saving}
            onChange={(e) => handlePatch({ status: e.target.value as CandidateStatus })}
            className="border rounded px-3 py-2"
          >
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Stage</label>
          <select
            value={candidate.stage}
            disabled={saving}
            onChange={(e) => handlePatch({ stage: e.target.value as CandidateStage })}
            className="border rounded px-3 py-2"
          >
            {STAGE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {saving && <p className="text-sm text-gray-500 mb-4">Saving...</p>}
      {saveError && <p className="text-sm text-red-600 mb-4">Error: {saveError}</p>}

      <dl className="grid grid-cols-2 gap-y-2 mb-8">
        <dt className="text-gray-500">Email</dt>
        <dd>{candidate.email}</dd>

        <dt className="text-gray-500">Phone</dt>
        <dd>{candidate.phone}</dd>

        <dt className="text-gray-500">LinkedIn</dt>
        <dd>
          {candidate.linkedin_url === null ? "No LinkedIn provided" : <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View profile</a>}
        </dd>

        <dt className="text-gray-500">CV</dt>
        <dd>
          <a href={candidate.cv_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">View CV</a>
        </dd>

        <dt className="text-gray-500">Years of experience</dt>
        <dd>{candidate.experience_years}</dd>

        <dt className="text-gray-500">Applied on</dt>
        <dd>{new Date(candidate.applied_at).toLocaleDateString()}</dd>
      </dl>

      <section>
        <h2 className="text-lg font-semibold mb-3">Internal notes</h2>

        <div className="flex gap-2 mb-4">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Add a note after a call or interview..."
            disabled={notesSaving}
            className="border rounded px-3 py-2 flex-1"
            rows={2}
          />
          <button
            onClick={handleAddNote}
            disabled={notesSaving || !newNoteContent.trim()}
            className="border rounded px-4 py-2 bg-blue-600 text-white disabled:opacity-50 self-start"
          >
            Add
          </button>
        </div>

        {notesError && <p className="text-sm text-red-600 mb-4">Error: {notesError}</p>}

        {notes.length === 0 ? (
          <p className="text-gray-500">No notes yet.</p>
        ) : (
          <ul className="space-y-3">
            {notes.map((note) => (
              <li key={note.id} className="border rounded p-3 flex justify-between items-start gap-3">
                <div>
                  <p>{note.content}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  disabled={notesSaving}
                  className="text-red-600 text-sm hover:underline shrink-0"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}