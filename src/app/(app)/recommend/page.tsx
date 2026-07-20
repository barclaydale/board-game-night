"use client";

import { useState } from "react";
import Link from "next/link";
import { getRecommendations } from "./actions";
import { VIBE_TAGS, VIBE_EMOJI, VIBE_LABELS } from "@/lib/bgg/vibeHeuristic";
import type { RecommendAnswers, ScoredGame } from "@/lib/recommend/scoring";

const DEFAULT_ANSWERS: RecommendAnswers = {
  players: 4,
  timeBucket: "60",
  vibe: VIBE_TAGS[0],
  complexity: "easy",
  teamStyle: "ffa",
  favorMode: "known",
};

function Pills<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(([optionValue, label]) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          className={`rounded-full border px-4 py-2 text-sm transition-colors ${
            value === optionValue
              ? "border-accent bg-accent-soft text-accent"
              : "border-border bg-surface text-foreground hover:border-accent"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

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
      <h1 className="font-display text-2xl font-semibold text-foreground">
        🎲 What&apos;s the vibe?
      </h1>
      <p className="mt-1 text-sm text-muted">
        Answer a few questions and we&apos;ll suggest something from your
        library.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-7 rounded-2xl border border-border bg-surface p-6"
      >
        <label className="flex flex-col gap-1 text-sm text-foreground">
          How many people?
          <input
            type="number"
            min={1}
            max={20}
            value={answers.players}
            onChange={(e) =>
              setAnswers({ ...answers, players: Number(e.target.value) })
            }
            className="w-24 rounded-full border border-border bg-background px-4 py-2"
          />
        </label>

        <div className="text-sm text-foreground">
          <p className="mb-2">How much time do you have?</p>
          <Pills
            options={
              [
                ["30", "⏱️ ~30 minutes"],
                ["60", "🕐 ~1 hour"],
                ["120plus", "🌙 2+ hours"],
              ] as const
            }
            value={answers.timeBucket}
            onChange={(timeBucket) => setAnswers({ ...answers, timeBucket })}
          />
        </div>

        <div className="text-sm text-foreground">
          <p className="mb-2">What&apos;s the vibe?</p>
          <Pills
            options={VIBE_TAGS.map(
              (tag) => [tag, `${VIBE_EMOJI[tag]} ${VIBE_LABELS[tag]}`] as const,
            )}
            value={answers.vibe}
            onChange={(vibe) => setAnswers({ ...answers, vibe })}
          />
        </div>

        <div className="text-sm text-foreground">
          <p className="mb-2">Complexity tolerance?</p>
          <Pills
            options={
              [
                ["easy", "Teach it in 2 minutes"],
                ["willing", "Happy to read the rules"],
              ] as const
            }
            value={answers.complexity}
            onChange={(complexity) => setAnswers({ ...answers, complexity })}
          />
        </div>

        <div className="text-sm text-foreground">
          <p className="mb-2">Team style?</p>
          <Pills
            options={
              [
                ["coop", "🤝 All working together"],
                ["team", "👥 Teams"],
                ["ffa", "⚔️ Every player for themselves"],
              ] as const
            }
            value={answers.teamStyle}
            onChange={(teamStyle) => setAnswers({ ...answers, teamStyle })}
          />
        </div>

        <div className="text-sm text-foreground">
          <p className="mb-2">New game or a favorite?</p>
          <Pills
            options={
              [
                ["surprise", "✨ Surprise us"],
                ["known", "💛 Something we know and love"],
              ] as const
            }
            value={answers.favorMode}
            onChange={(favorMode) => setAnswers({ ...answers, favorMode })}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-fit rounded-full bg-accent px-6 py-3 font-display font-medium text-accent-foreground shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-50"
        >
          {loading ? "Thinking…" : "Recommend games 🎲"}
        </button>
      </form>

      {results && (
        <div className="mt-10">
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
            Suggestions
          </h2>
          {results.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-muted">
              Nothing matched well — try loosening the player count or vibe.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {results.map(({ game, reasons }) => (
                <li
                  key={game.id}
                  className="rounded-2xl border border-border bg-surface p-5 shadow-sm"
                >
                  <Link
                    href={`/library/${game.id}`}
                    className="font-display text-lg font-medium text-foreground underline"
                  >
                    {game.name}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {game.minPlayers}–{game.maxPlayers} players ·{" "}
                    {game.playingTime} min
                  </p>
                  {reasons.length > 0 && (
                    <p className="mt-2 text-xs text-accent">
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
