"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logPlay } from "./actions";

interface Row {
  key: string;
  name: string;
  score: string;
  notes: string;
}

function newRow(): Row {
  return { key: crypto.randomUUID(), name: "", score: "", notes: "" };
}

export function LogPlayForm({
  games,
  participantNames,
}: {
  games: { id: string; name: string }[];
  participantNames: string[];
}) {
  const router = useRouter();
  const [gameId, setGameId] = useState("");
  const [playedAt, setPlayedAt] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>(() => [newRow(), newRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateRow(key: string, field: keyof Row, value: string) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)),
    );
  }

  function removeRow(key: string) {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!gameId) {
      setError("Pick a game first");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await logPlay({
        gameId,
        playedAt,
        durationMinutes: durationMinutes.trim()
          ? Number(durationMinutes)
          : null,
        notes: notes.trim() || null,
        participants: rows
          .filter((r) => r.name.trim())
          .map((r) => ({
            name: r.name.trim(),
            score: r.score.trim() ? Number(r.score) : null,
            notes: r.notes,
          })),
      });
      setGameId("");
      setDurationMinutes("");
      setNotes("");
      setRows([newRow(), newRow()]);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
      <select
        value={gameId}
        onChange={(e) => setGameId(e.target.value)}
        className="rounded-full border border-border bg-background px-4 py-2 text-sm"
      >
        <option value="" disabled>
          Which game?
        </option>
        {games.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      <div className="flex gap-3">
        <input
          type="date"
          value={playedAt}
          onChange={(e) => setPlayedAt(e.target.value)}
          className="rounded-full border border-border bg-background px-4 py-2 text-sm"
        />
        <input
          type="number"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="Duration (min)"
          min={1}
          className="w-40 rounded-full border border-border bg-background px-4 py-2 text-sm placeholder:text-muted"
        />
      </div>

      <datalist id="participant-names">
        {participantNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      <table className="w-full border-separate border-spacing-y-2 text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="w-2/5 pb-1 font-normal">Name</th>
            <th className="w-1/6 pb-1 font-normal">Score</th>
            <th className="pb-1 font-normal">Notes</th>
            <th className="w-6" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td className="pr-2 align-top">
                <input
                  list="participant-names"
                  value={row.name}
                  onChange={(e) => updateRow(row.key, "name", e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-full border border-border bg-background px-3 py-1.5"
                />
              </td>
              <td className="pr-2 align-top">
                <input
                  type="number"
                  value={row.score}
                  onChange={(e) => updateRow(row.key, "score", e.target.value)}
                  placeholder="—"
                  className="w-full rounded-full border border-border bg-background px-3 py-1.5"
                />
              </td>
              <td className="pr-2 align-top">
                <input
                  value={row.notes}
                  onChange={(e) => updateRow(row.key, "notes", e.target.value)}
                  placeholder="Notes"
                  className="w-full rounded-full border border-border bg-background px-3 py-1.5"
                />
              </td>
              <td className="align-top">
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="px-1 text-muted hover:text-accent"
                  aria-label="Remove row"
                >
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        type="button"
        onClick={() => setRows((prev) => [...prev, newRow()])}
        className="w-fit text-xs text-accent underline"
      >
        + Add participant
      </button>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Overall notes for the session (optional)"
        rows={2}
        className="rounded-2xl border border-border bg-background px-4 py-2 text-sm placeholder:text-muted"
      />

      {error && <p className="text-sm text-accent">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-fit rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground disabled:opacity-50"
      >
        {submitting ? "Logging…" : "Log play"}
      </button>
    </form>
  );
}
