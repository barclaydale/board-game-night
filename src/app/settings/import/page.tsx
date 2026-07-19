"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type Progress =
  | { status: "idle" }
  | { status: "pending_collection"; waitingOnBgg: boolean }
  | { status: "fetching_details"; cursor: number; totalGames: number }
  | { status: "complete"; totalGames: number }
  | { status: "error"; error: string };

const POLL_INTERVAL_MS = 3000;

export default function ImportPage() {
  const [username, setUsername] = useState("");
  const [progress, setProgress] = useState<Progress>({ status: "idle" });
  const jobIdRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function poll(jobId: string) {
    const res = await fetch(`/api/import/status/${jobId}`);
    const data: Progress = await res.json();
    setProgress(data);

    if (data.status === "complete" || data.status === "error") {
      return;
    }
    timerRef.current = setTimeout(() => poll(jobId), POLL_INTERVAL_MS);
  }

  async function startImport(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) return;

    setProgress({ status: "pending_collection", waitingOnBgg: false });

    const res = await fetch("/api/import/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bggUsername: username.trim() }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setProgress({
        status: "error",
        error: data.error ?? "Failed to start import",
      });
      return;
    }

    const { jobId } = await res.json();
    jobIdRef.current = jobId;
    poll(jobId);
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Import from BoardGameGeek</h1>
        <Link href="/library" className="text-sm text-gray-500 underline">
          Library
        </Link>
      </div>

      <form onSubmit={startImport} className="flex gap-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="BGG username"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={
            progress.status === "pending_collection" ||
            progress.status === "fetching_details"
          }
          className="rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          Import
        </button>
      </form>

      <div className="mt-6 text-sm">
        {progress.status === "idle" && (
          <p className="text-gray-500">
            Enter a BGG username to import their owned games into the
            library.
          </p>
        )}
        {progress.status === "pending_collection" && (
          <p>Waiting on BoardGameGeek to prepare the collection export…</p>
        )}
        {progress.status === "fetching_details" && (
          <p>
            Fetching game details… {progress.cursor}/{progress.totalGames}
          </p>
        )}
        {progress.status === "complete" && (
          <p className="text-green-700">
            Done — {progress.totalGames} games synced.{" "}
            <Link href="/library" className="underline">
              View library
            </Link>
          </p>
        )}
        {progress.status === "error" && (
          <p className="text-red-700">Error: {progress.error}</p>
        )}
      </div>

      <p className="mt-12 text-xs text-gray-400">
        Powered by{" "}
        <a
          href="https://boardgamegeek.com"
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          BoardGameGeek
        </a>
      </p>
    </div>
  );
}
