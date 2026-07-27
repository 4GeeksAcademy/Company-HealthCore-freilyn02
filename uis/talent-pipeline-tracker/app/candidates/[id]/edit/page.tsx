"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCandidateById, updateCandidate } from "@/services/candidates";
import { ApiError } from "@/services/api";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: "",
};

export default function EditCandidatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  // Two different loading concerns: fetching the existing candidate
  // to pre-fill the form, versus submitting the edited form.
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCandidate() {
      setLoading(true);
      setLoadError(null);
      try {
        const candidate = await getCandidateById(params.id);
        // Pre-fill the form with the candidate's current data.
        // Number fields and nullable strings are converted to plain
        // strings here, since form inputs only work with strings.
        setForm({
          full_name: candidate.full_name,
          email: candidate.email,
          phone: candidate.phone,
          position: candidate.position,
          linkedin_url: candidate.linkedin_url ?? "",
          cv_url: candidate.cv_url ?? "",
          experience_years: String(candidate.experience_years),
        });
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Something went wrong while loading this candidate.";
        setLoadError(message);
      } finally {
        setLoading(false);
      }
    }

    loadCandidate();
  }, [params.id]);

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): string | null {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!form.phone.trim()) return "Phone is required.";
    if (!form.position.trim()) return "Position is required.";
    if (!form.experience_years.trim()) return "Years of experience is required.";
    if (isNaN(Number(form.experience_years))) return "Years of experience must be a number.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await updateCandidate(params.id, {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        position: form.position.trim(),
        linkedin_url: form.linkedin_url.trim() || null,
        cv_url: form.cv_url.trim() || null,
        experience_years: Number(form.experience_years),
      });
      router.push(`/candidates/${params.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong while saving this candidate.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="p-6">Loading candidate...</p>;
  }

  if (loadError) {
    return <p className="p-6 text-red-600">Error: {loadError}</p>;
  }

  return (
    <main className="p-6 max-w-lg">
      <button onClick={() => router.push(`/candidates/${params.id}`)} className="text-blue-600 hover:underline mb-4">
        Back to candidate
      </button>

      <h1 className="text-2xl font-bold mb-6">Edit candidate data</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-500 mb-1">Full name *</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Phone *</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Position *</label>
          <input
            type="text"
            value={form.position}
            onChange={(e) => updateField("position", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">LinkedIn URL (optional)</label>
          <input
            type="text"
            value={form.linkedin_url}
            onChange={(e) => updateField("linkedin_url", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">CV URL (optional)</label>
          <input
            type="text"
            value={form.cv_url}
            onChange={(e) => updateField("cv_url", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-500 mb-1">Years of experience *</label>
          <input
            type="number"
            value={form.experience_years}
            onChange={(e) => updateField("experience_years", e.target.value)}
            className="border rounded px-3 py-2 w-full"
          />
        </div>

        {submitError && <p className="text-sm text-red-600">Error: {submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="border rounded px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
        >
          {submitting ? "Saving..." : "Save changes"}
        </button>
      </form>
    </main>
  );
}