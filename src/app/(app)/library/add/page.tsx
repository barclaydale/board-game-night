"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { searchBggGames, addGameToLibrary, type SearchResultItem } from "./actions";

export default function AddGamePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const data = await searchBggGames(query.trim());
      setResults(data.sort((a, b) => (b.yearPublished ?? 0) - (a.yearPublished ?? 0)));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(bggId: number) {
    setAddingId(bggId);
    setError(null);
    try {
      const { gameId } = await addGameToLibrary(bggId);
      router.push(`/library/${gameId}`);
    } catch (err) {
      setError((err as Error).message);
      setAddingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        ➕ Add a game
      </h1>
      <p className="mt-1 text-sm text-muted">
        Search BoardGameGeek and add the ones you own.
      </p>

      <form
        onSubmit={handleSearch}
        className="mt-6 flex gap-2 rounded-2xl border border-border bg-surface p-3"
      >
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Game name…"
          className="flex-1 rounded-full border border-border bg-background px-4 py-2 placeholder:text-muted"
        />
        <button
          type="submit"
          disabled={searching}
          className="rounded-full bg-accent px-5 py-2 font-medium text-accent-foreground disabled:opacity-50"
        >
          {searching ? "Searching…" : "Search"}
        </button>
      </form>

      {error && <p className="mt-4 text-sm text-accent">{error}</p>}

      {results && (
        <ul className="mt-6 flex flex-col gap-3">
          {results.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-muted">
              No results on BoardGameGeek for &quot;{query}&quot;.
            </p>
          )}
          {results.map((r) => (
            <li
              key={r.bggId}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
            >
              <span className="text-sm text-foreground">
                {r.name}{" "}
                <span className="text-muted">{r.yearPublished ?? ""}</span>
              </span>
              {r.alreadyInLibrary ? (
                <span className="text-xs text-secondary">✓ In library</span>
              ) : (
                <button
                  onClick={() => handleAdd(r.bggId)}
                  disabled={addingId === r.bggId}
                  className="rounded-full border border-border bg-background px-4 py-1.5 text-sm text-foreground transition-colors hover:border-accent disabled:opacity-50"
                >
                  {addingId === r.bggId ? "Adding…" : "Add"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-12 text-xs text-muted">
        Powered by{" "}
        <Link
          href="https://boardgamegeek.com"
          className="underline"
          target="_blank"
        >
          BoardGameGeek
        </Link>
      </p>
    </div>
  );
}
