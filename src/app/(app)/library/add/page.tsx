"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  searchBggGames,
  addGameToLibrary,
  type SearchResultItem,
} from "./actions";

const SORT_OPTIONS = [
  ["rating-desc", "Rating: high to low"],
  ["rating-asc", "Rating: low to high"],
  ["year-desc", "Year: newest first"],
  ["year-asc", "Year: oldest first"],
  ["name-asc", "Name: A–Z"],
] as const;

type SortKey = (typeof SORT_OPTIONS)[number][0];

function sortResults(
  results: SearchResultItem[],
  sort: SortKey,
): SearchResultItem[] {
  const sorted = [...results];
  switch (sort) {
    case "rating-desc":
      return sorted.sort((a, b) => (b.bggRating ?? -1) - (a.bggRating ?? -1));
    case "rating-asc":
      return sorted.sort(
        (a, b) =>
          (a.bggRating ?? Infinity) - (b.bggRating ?? Infinity),
      );
    case "year-desc":
      return sorted.sort(
        (a, b) => (b.yearPublished ?? 0) - (a.yearPublished ?? 0),
      );
    case "year-asc":
      return sorted.sort(
        (a, b) => (a.yearPublished ?? 9999) - (b.yearPublished ?? 9999),
      );
    case "name-asc":
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
}

export default function AddGamePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[] | null>(null);
  const [sort, setSort] = useState<SortKey>("rating-desc");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedResults = useMemo(
    () => (results ? sortResults(results, sort) : null),
    [results, sort],
  );

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError(null);
    try {
      const data = await searchBggGames(query.trim());
      setResults(data);
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
    <div className="mx-auto max-w-2xl px-6 py-12">
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

      {sortedResults && (
        <>
          {sortedResults.length > 0 && (
            <div className="mt-6 flex items-center justify-between text-sm">
              <span className="text-muted">
                {sortedResults.length} result
                {sortedResults.length === 1 ? "" : "s"}
              </span>
              <label className="flex items-center gap-2 text-muted">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-foreground"
                >
                  {SORT_OPTIONS.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <ul className="mt-3 flex flex-col gap-3">
            {sortedResults.length === 0 && (
              <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-muted">
                No results on BoardGameGeek for &quot;{query}&quot;.
              </p>
            )}
            {sortedResults.map((r) => {
              const expanded = expandedId === r.bggId;
              return (
                <li
                  key={r.bggId}
                  className="rounded-2xl border border-border bg-surface p-4"
                >
                  <div className="flex gap-3">
                    {r.thumbnail && (
                      <Image
                        src={r.thumbnail}
                        alt=""
                        width={64}
                        height={64}
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-display font-medium text-foreground">
                            {r.name}{" "}
                            <span className="font-sans text-sm font-normal text-muted">
                              {r.yearPublished ?? ""}
                            </span>
                          </p>
                          <p className="mt-0.5 text-xs text-muted">
                            {r.bggRating ? `★ ${r.bggRating.toFixed(1)}` : "unrated"}
                            {r.minPlayers && r.maxPlayers
                              ? ` · ${r.minPlayers}–${r.maxPlayers} players`
                              : ""}
                            {r.playingTime ? ` · ${r.playingTime} min` : ""}
                          </p>
                        </div>
                        {r.alreadyInLibrary ? (
                          <span className="shrink-0 text-xs text-secondary">
                            ✓ In library
                          </span>
                        ) : (
                          <button
                            onClick={() => handleAdd(r.bggId)}
                            disabled={addingId === r.bggId}
                            className="shrink-0 rounded-full border border-border bg-background px-4 py-1.5 text-sm text-foreground transition-colors hover:border-accent disabled:opacity-50"
                          >
                            {addingId === r.bggId ? "Adding…" : "Add"}
                          </button>
                        )}
                      </div>

                      {r.description && (
                        <div className="mt-2">
                          <p
                            className={`text-sm text-muted ${expanded ? "" : "line-clamp-2"}`}
                          >
                            {r.description}
                          </p>
                          <button
                            onClick={() =>
                              setExpandedId(expanded ? null : r.bggId)
                            }
                            className="mt-1 text-xs text-accent underline"
                          >
                            {expanded ? "Show less" : "Show more"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
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
