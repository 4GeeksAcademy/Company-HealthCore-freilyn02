"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCandidate } from "@/services/candidates";
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

export default function NewCandidatePage() {
  const router = useRouter();

  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
      const created = await createCandidate({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        position: form.position.trim(),
        linkedin_url: form.linkedin_url.trim() || null,
        cv_url: form.cv_url.trim() || null,
        experience_years: Number(form.experience_years),
      });
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
    <div className="max-w-lg">
      <button onClick={() => router.push("/")} className="mb-4 font-semibold text-[#ff6a3d] hover:underline">
        Back to list
      </button>

      <h1 className="mb-6 font-[family-name:var(--font-space-grotesk)] text-2xl tracking-[-0.03em]">Register a referral candidate</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-[28px] border border-[rgba(16,16,16,0.06)] bg-white p-6 shadow-[0_14px_30px_rgba(16,16,16,0.05)]">
        <div>
          <label className="mb-1 block text-sm text-[#5f5a54]">Full name *</label>
          <input
            type="text"
            value={form.full_name}
            onChange={(e) => updateField("full_name", e.target.value)}
            className="w-full rounded-xl border border-[rgba(16,16,16,0.14)] px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5f5a54]">Email *</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="w-full rounded-xl border border-[rgba(16,16,16,0.14)] px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5f5a54]">Phone *</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full rounded-xl border border-[rgba(16,16,16,0.14)] px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5f5a54]">Position *</label>
          <input
            type="text"
            value={form.position}
            onChange={(e) => updateField("position", e.target.value)}
            className="w-full rounded-xl border border-[rgba(16,16,16,0.14)] px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5f5a54]">LinkedIn URL (optional)</label>
          <input
            type="text"
            value={form.linkedin_url}
            onChange={(e) => updateField("linkedin_url", e.target.value)}
            className="w-full rounded-xl border border-[rgba(16,16,16,0.14)] px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5f5a54]">CV URL (optional)</label>
          <input
            type="text"
            value={form.cv_url}
            onChange={(e) => updateField("cv_url", e.target.value)}
            className="w-full rounded-xl border border-[rgba(16,16,16,0.14)] px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-[#5f5a54]">Years of experience *</label>
          <input
            type="number"
            value={form.experience_years}
            onChange={(e) => updateField("experience_years", e.target.value)}
            className="w-full rounded-xl border border-[rgba(16,16,16,0.14)] px-4 py-2 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
          />
        </div>

        {submitError && <p className="text-sm font-semibold text-[#b3261e]">Error: {submitError}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-[#ff6a3d] px-5 py-3 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#e4542c] disabled:opacity-50"
        >
          {submitting ? "Registering..." : "Register candidate"}
        </button>
      </form>
    </div>
  );
}