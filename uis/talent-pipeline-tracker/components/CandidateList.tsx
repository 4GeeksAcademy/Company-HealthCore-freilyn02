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
    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            Executive Assistant — Austin headquarters
          </h1>
          <p className="text-gray-600">
            Candidate pipeline for the active search
          </p>
        </div>
        <Link
          href="/candidates/new"
          className="border rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700"
        >
          + Register referral
        </Link>
      </div>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
          defaultValue={search}
          onChange={(e) => updateFilter("search", e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />

        <select
          value={status}
          onChange={(e) => updateFilter("status", e.target.value)}
          className="border rounded px-3 py-2"
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
          className="border rounded px-3 py-2"
        >
          <option value="">All stages</option>
          {STAGE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {loading && <p>Loading candidates...</p>}
      {error && <p className="text-red-600">Error: {error}</p>}

      {!loading && !error && (
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b">
              <th className="p-2">Name</th>
              <th className="p-2">Position</th>
              <th className="p-2">Status</th>
              <th className="p-2">Stage</th>
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr
                key={candidate.id}
                className="border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => router.push(`/candidates/${candidate.id}`)}
              >
                <td className="p-2">
                  <Link href={`/candidates/${candidate.id}`} className="text-blue-600 hover:underline">
                    {candidate.full_name}
                  </Link>
                </td>
                <td className="p-2">{candidate.position}</td>
                <td className="p-2">{STATUS_LABELS[candidate.status]}</td>
                <td className="p-2">{STAGE_LABELS[candidate.stage]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {!loading && !error && candidates.length === 0 && (
        <p className="text-gray-500 mt-4">No candidates match these filters.</p>
      )}
    </main>
  );
}