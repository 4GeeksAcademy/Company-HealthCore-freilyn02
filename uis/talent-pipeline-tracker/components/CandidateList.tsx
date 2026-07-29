"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getCandidates } from "@/services/candidates";
import { ApiError } from "@/services/api";
import { STATUS_LABELS, STAGE_LABELS, STATUS_OPTIONS, STAGE_OPTIONS } from "@/lib/labels";
import type { Candidate } from "@/types/candidate";

export default function CandidateList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "";
  const stage = searchParams.get("stage") ?? "";
  const search = searchParams.get("search") ?? "";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  }

  useEffect(() => {
    async function loadCandidates() {
      setLoading(true);
      setError(null);
      try {
        const response = await getCandidates({
          status: (status || undefined) as Candidate["status"] | undefined,
          stage: (stage || undefined) as Candidate["stage"] | undefined,
          search: search || undefined,
          limit: 100,
        });
        setCandidates(response.data);
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Something went wrong while loading candidates.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadCandidates();
  }, [status, stage, search]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 inline-block text-[0.78rem] font-extrabold uppercase tracking-[0.14em] text-[#ff6a3d]">
            People &amp; Talent
          </p>
          <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl tracking-[-0.03em]">
            Executive Assistant — Austin headquarters
          </h1>
          <p className="mt-1 text-[#5f5a54]">Candidate pipeline for the active search</p>
        </div>
        <Link
          href="/candidates/new"
          className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#ff6a3d] px-5 py-2 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-[#e4542c]"
        >
          + Register referral
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          defaultValue={search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="flex-1 rounded-xl border border-[rgba(16,16,16,0.14)] bg-white px-4 py-3 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
        />

        <select
          value={status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="rounded-xl border border-[rgba(16,16,16,0.14)] bg-white px-4 py-3 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={stage}
          onChange={(e) => updateFilter("stage", e.target.value)}
          className="rounded-xl border border-[rgba(16,16,16,0.14)] bg-white px-4 py-3 outline-none transition focus:border-[#ff6a3d] focus:ring-2 focus:ring-[#ff6a3d]/20"
        >
          <option value="">All stages</option>
          {STAGE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="text-[#5f5a54]">Loading candidates...</p>}
      {error && <p className="font-semibold text-[#b3261e]">Error: {error}</p>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-[28px] border border-[rgba(16,16,16,0.06)] bg-white shadow-[0_14px_30px_rgba(16,16,16,0.05)]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-[rgba(16,16,16,0.08)] text-left">
                <th className="p-4 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-[#5f5a54]">Name</th>
                <th className="p-4 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-[#5f5a54]">Position</th>
                <th className="p-4 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-[#5f5a54]">Status</th>
                <th className="p-4 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-[#5f5a54]">Stage</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((candidate) => (
                <tr
                  key={candidate.id}
                  className="cursor-pointer border-b border-[rgba(16,16,16,0.06)] transition hover:bg-[#fff8ef]"
                  onClick={() => router.push(`/candidates/${candidate.id}`)}
                >
                  <td className="p-4">
                    <Link href={`/candidates/${candidate.id}`} className="font-semibold text-[#ff6a3d] hover:underline">
                      {candidate.full_name}
                    </Link>
                  </td>
                  <td className="p-4">{candidate.position}</td>
                  <td className="p-4">{STATUS_LABELS[candidate.status]}</td>
                  <td className="p-4">{STAGE_LABELS[candidate.stage]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && candidates.length === 0 && (
        <p className="mt-4 text-[#5f5a54]">No candidates match these filters.</p>
      )}
    </div>
  );
}