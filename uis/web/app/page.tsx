"use client";

import { useState } from "react";
import { AnalysisSummary } from "@/types/incident-analysis";
import { analyzeIncidents, getExportUrl } from "@/services/incidents";

type RequestState = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  }

  async function handleAnalyze() {
    if (!selectedFile) return;

    setRequestState("loading");
    setErrorMessage("");

    try {
      const result = await analyzeIncidents(selectedFile);
      setSummary(result);
      setRequestState("success");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unexpected error.");
      setRequestState("error");
    }
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-2">HealthCore Incident Analyzer</h1>
      <p className="text-gray-600 mb-6">
        Upload the after-sales incident report (CSV) to validate records and view metrics.
      </p>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="block w-full text-sm"
        />
        {selectedFile && (
          <p className="text-sm text-gray-500 mt-2">Selected: {selectedFile.name}</p>
        )}
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!selectedFile || requestState === "loading"}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        {requestState === "loading" ? "Analyzing..." : "Analyze"}
      </button>

      {requestState === "error" && (
        <p className="text-red-600 mt-4">{errorMessage}</p>
      )}

      {requestState === "success" && summary && (
        <div className="mt-8 space-y-6">
          <section>
            <h2 className="text-lg font-semibold mb-2">Totals</h2>
            <ul className="text-sm space-y-1">
              <li>Total records: {summary.total_records}</li>
              <li>Valid records: {summary.valid_records}</li>
              <li>Invalid records: {summary.invalid_records}</li>
            </ul>
          </section>

          {summary.invalid_records > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-2">Invalid records by reason</h2>
              <ul className="text-sm space-y-1">
                {Object.entries(summary.invalid_by_reason).map(([reason, count]) => (
                  <li key={reason}>
                    {reason}: {count}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold mb-2">Breakdown by category</h2>
            <ul className="text-sm space-y-1">
              {Object.entries(summary.category_breakdown).map(([category, count]) => (
                <li key={category}>
                  {category}: {count}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Breakdown by status</h2>
            <ul className="text-sm space-y-1">
              {Object.entries(summary.status_breakdown).map(([status, count]) => (
                <li key={status}>
                  {status}: {count}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-2">Satisfaction (closed incidents)</h2>
            <ul className="text-sm space-y-1">
              <li>Scored closed incidents: {summary.satisfaction.scored_closed_count}</li>
              <li>
                Average score:{" "}
                {summary.satisfaction.average_score !== null
                  ? summary.satisfaction.average_score
                  : "N/A"}
              </li>
            </ul>
          </section>
          <a
            href={getExportUrl()}
            className="inline-block bg-green-600 text-white px-4 py-2 rounded"
          >
            Download results as CSV
          </a>
        </div>
      )}
    </main>
  );
}
