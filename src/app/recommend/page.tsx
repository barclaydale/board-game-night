"use client";

import { useState } from "react";
import Link from "next/link";
import { getRecommendations } from "./actions";
import { VIBE_TAGS } from "@/lib/bgg/vibeHeuristic";
import type { RecommendAnswers, ScoredGame } from "@/lib/recommend/scoring";

const DEFAULT_ANSWERS: RecommendAnswers = {
  players: 4,
  timeBucket: "60",
  vibe: VIBE_TAGS[0],
  complexity: "easy",
  teamStyle: "ffa",
  favorMode: "known",
};

export default function RecommendPage() {
  const [answers, setAnswers] = useState<RecommendAnswers>(DEFAULT_ANSWERS);
  const [results, setResults] = useState<ScoredGame[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await getRecommendations(answers);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">What&apos;s the vibe?</h1>
        <Link href="/library" className="text-sm text-gray-500 underline">
          Library
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <label className="flex flex-col gap-1 text-sm">
          How many people?
          <input
            type="number"
            min={1}
            max={20}
            value={answers.players}
            onChange={(e) =>
              setAnswers({ ...answers, players: Number(e.target.value) })
            }
            className="w-24 rounded-md border border-gray-300 px-3 py-2"
          />
        </label>

        <fieldset className="text-sm">
          <legend className="mb-1">How much time do you have?</legend>
          {(
            [
              ["30", "~30 minutes"],
              ["60", "~1 hour"],
              ["120plus", "2+ hours"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="mr-4 inline-flex items-center gap-1">
              <input
                type="radio"
                name="timeBucket"
                checked={answers.timeBucket === value}
                onChange={() => setAnswers({ ...answers, timeBucket: value })}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <label className="flex flex-col gap-1 text-sm">
          What&apos;s the vibe?
          <select
            value={answers.vibe}
            onChange={(e) =>
              setAnswers({
                ...answers,
                vibe: e.target.value as RecommendAnswers["vibe"],
              })
            }
            className="w-fit rounded-md border border-gray-300 px-3 py-2"
          >
            {VIBE_TAGS.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="text-sm">
          <legend className="mb-1">Complexity tolerance?</legend>
          {(
            [
              ["easy", "Teach it in 2 minutes"],
              ["willing", "Happy to read the rules"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="mr-4 inline-flex items-center gap-1">
              <input
                type="radio"
                name="complexity"
                checked={answers.complexity === value}
                onChange={() => setAnswers({ ...answers, complexity: value })}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="text-sm">
          <legend className="mb-1">Team style?</legend>
          {(
            [
              ["coop", "All working together"],
              ["team", "Teams"],
              ["ffa", "Every player for themselves"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="mr-4 inline-flex items-center gap-1">
              <input
                type="radio"
                name="teamStyle"
                checked={answers.teamStyle === value}
                onChange={() => setAnswers({ ...answers, teamStyle: value })}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="text-sm">
          <legend className="mb-1">New game or a favorite?</legend>
          {(
            [
              ["surprise", "Surprise us"],
              ["known", "Something we know and love"],
            ] as const
          ).map(([value, label]) => (
            <label key={value} className="mr-4 inline-flex items-center gap-1">
              <input
                type="radio"
                name="favorMode"
                checked={answers.favorMode === value}
                onChange={() => setAnswers({ ...answers, favorMode: value })}
              />
              {label}
            </label>
          ))}
        </fieldset>

        <button
          type="submit"
          disabled={loading}
          className="w-fit rounded-md bg-black px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Recommend games"}
        </button>
      </form>

      {results && (
        <div className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Suggestions</h2>
          {results.length === 0 ? (
            <p className="text-gray-500">
              Nothing matched well — try loosening the player count or vibe.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {results.map(({ game, reasons }) => (
                <li
                  key={game.id}
                  className="rounded-md border border-gray-200 p-4"
                >
                  <Link
                    href={`/library/${game.id}`}
                    className="text-lg font-medium underline"
                  >
                    {game.name}
                  </Link>
                  <p className="mt-1 text-sm text-gray-600">
                    {game.minPlayers}–{game.maxPlayers} players ·{" "}
                    {game.playingTime} min
                  </p>
                  {reasons.length > 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      {reasons.join(" · ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
