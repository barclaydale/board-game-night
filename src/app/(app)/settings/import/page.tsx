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

  const isRunning =
    progress.status === "pending_collection" ||
    progress.status === "fetching_details";

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        📥 Import from BoardGameGeek
      </h1>
      <p className="mt-1 text-sm text-muted">
        Pull your owned games straight into the library.
      </p>

      <form
        onSubmit={startImport}
        className="mt-6 flex gap-2 rounded-2xl border border-border bg-surface p-3"
      >
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="BGG username"
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={isRunning}
          className="rounded-full bg-accent px-5 py-2 font-medium text-accent-foreground disabled:opacity-50"
        >
          Import
        </button>
      </form>

      <div className="mt-6 text-sm">
        {progress.status === "idle" && (
          <p className="text-muted">
            Enter a BGG username to import their owned games into the
            library.
          </p>
        )}
        {isRunning && (
          <p className="flex items-center gap-2 text-foreground">
            <span className="animate-pulse">🎲</span>
            {progress.status === "pending_collection"
              ? "Waiting on BoardGameGeek to prepare the collection export…"
              : `Fetching game details… ${progress.cursor}/${progress.totalGames}`}
          </p>
        )}
        {progress.status === "complete" && (
          <p className="text-secondary">
            ✅ Done — {progress.totalGames} games synced.{" "}
            <Link href="/library" className="underline">
              View library
            </Link>
          </p>
        )}
        {progress.status === "error" && (
          <p className="text-accent">Error: {progress.error}</p>
        )}
      </div>

      <p className="mt-12 text-xs text-muted">
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
