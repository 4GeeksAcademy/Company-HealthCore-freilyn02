"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCandidate } from "@/services/candidates";
import { ApiError } from "@/services/api";

// Empty starting values for the form. Kept as a separate constant so
// resetting the form (if we ever need to) is a one-line operation.
const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  position: "",
  linkedin_url: "",
  cv_url: "",
  experience_years: "",
};

export default function NewCandidatePage() {
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Basic required-field validation, as asked in the assignment
  // ("Both forms must validate required fields before submission").
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
      const created = await createCandidate({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        position: form.position.trim(),
        linkedin_url: form.linkedin_url.trim() || null,
        cv_url: form.cv_url.trim() || null,
        experience_years: Number(form.experience_years),
      });
      // On success, go straight to the new candidate's detail page.
      router.push(`/candidates/${created.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : "Something went wrong while registering this candidate.";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="p-6 max-w-lg">
      <button onClick={() => router.push("/")} className="text-blue-600 hover:underline mb-4">
        Back to list
      </button>

      <h1 className="text-2xl font-bold mb-6">Register a referral candidate</h1>

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
          {submitting ? "Registering..." : "Register candidate"}
        </button>
      </form>
    </main>
  );
}