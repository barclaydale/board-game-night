import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { VIBE_TAGS, VIBE_EMOJI, VIBE_LABELS } from "@/lib/bgg/vibeHeuristic";
import { LEVEL_DOTS } from "@/lib/bgg/skillLuck";

export const dynamic = "force-dynamic";

interface LibraryPageProps {
  searchParams: Promise<{
    q?: string;
    vibe?: string;
    category?: string;
    mechanism?: string;
    players?: string;
    maxDuration?: string;
    minRating?: string;
    coop?: string;
    skill?: string;
    luck?: string;
    minPlays?: string;
  }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const {
    q,
    vibe,
    category,
    mechanism,
    players,
    maxDuration,
    minRating,
    coop,
    skill,
    luck,
    minPlays,
  } = await searchParams;

  const where: Prisma.GameWhereInput = { inLibrary: true };

  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }
  if (vibe) {
    where.vibeTags = { has: vibe };
  }
  if (category) {
    where.categories = { has: category };
  }
  if (mechanism) {
    where.mechanisms = { has: mechanism };
  }
  if (players) {
    const n = Number(players);
    if (Number.isFinite(n)) {
      where.minPlayers = { lte: n };
      where.maxPlayers = { gte: n };
    }
  }
  if (maxDuration) {
    const d = Number(maxDuration);
    if (Number.isFinite(d)) {
      where.playingTime = { lte: d };
    }
  }
  if (minRating) {
    const r = Number(minRating);
    if (Number.isFinite(r)) {
      where.bggRating = { gte: r };
    }
  }
  if (coop === "coop") {
    where.isCooperative = true;
  } else if (coop === "competitive") {
    where.isCooperative = false;
  }
  if (skill === "low" || skill === "medium" || skill === "high") {
    where.skillLevel = skill;
  }
  if (luck === "low" || luck === "medium" || luck === "high") {
    where.luckLevel = luck;
  }

  const [gamesWithCounts, libraryTags] = await Promise.all([
    prisma.game.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { plays: true } } },
    }),
    prisma.game.findMany({
      where: { inLibrary: true },
      select: { categories: true, mechanisms: true },
    }),
  ]);

  const minPlaysNum = minPlays ? Number(minPlays) : null;
  const games =
    minPlaysNum !== null && Number.isFinite(minPlaysNum)
      ? gamesWithCounts.filter((g) => g._count.plays >= minPlaysNum)
      : gamesWithCounts;

  const allCategories = Array.from(
    new Set(libraryTags.flatMap((g) => g.categories)),
  ).sort();
  const allMechanisms = Array.from(
    new Set(libraryTags.flatMap((g) => g.mechanisms)),
  ).sort();

  const hasFilters =
    q ||
    vibe ||
    category ||
    mechanism ||
    players ||
    maxDuration ||
    minRating ||
    coop ||
    skill ||
    luck ||
    minPlays;

  const selectClass =
    "rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground";

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        📚 Library
      </h1>
      <p className="mt-1 text-sm text-muted">
        {games.length} game{games.length === 1 ? "" : "s"}
      </p>

      <form className="mt-6 mb-8 flex flex-wrap gap-2" action="/library">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name"
          className="flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm placeholder:text-muted"
        />
        <select name="vibe" defaultValue={vibe ?? ""} className={selectClass}>
          <option value="">Any vibe</option>
          {VIBE_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {VIBE_EMOJI[tag]} {VIBE_LABELS[tag]}
            </option>
          ))}
        </select>
        <select
          name="category"
          defaultValue={category ?? ""}
          className={selectClass}
        >
          <option value="">Any category</option>
          {allCategories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          name="mechanism"
          defaultValue={mechanism ?? ""}
          className={selectClass}
        >
          <option value="">Any mechanism</option>
          {allMechanisms.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="players"
          defaultValue={players}
          placeholder="# players"
          min={1}
          className="w-24 rounded-full border border-border bg-surface px-4 py-2 text-sm placeholder:text-muted"
        />
        <input
          type="number"
          name="maxDuration"
          defaultValue={maxDuration}
          placeholder="Max minutes"
          min={5}
          step={5}
          className="w-32 rounded-full border border-border bg-surface px-4 py-2 text-sm placeholder:text-muted"
        />
        <input
          type="number"
          name="minRating"
          defaultValue={minRating}
          placeholder="Min BGG rating"
          min={1}
          max={10}
          step={0.5}
          className="w-36 rounded-full border border-border bg-surface px-4 py-2 text-sm placeholder:text-muted"
        />
        <select name="coop" defaultValue={coop ?? ""} className={selectClass}>
          <option value="">Co-op or competitive</option>
          <option value="coop">🤝 Co-op</option>
          <option value="competitive">⚔️ Competitive</option>
        </select>
        <select name="skill" defaultValue={skill ?? ""} className={selectClass}>
          <option value="">Any skill level</option>
          <option value="low">○ Low skill</option>
          <option value="medium">◐ Medium skill</option>
          <option value="high">● High skill</option>
        </select>
        <select name="luck" defaultValue={luck ?? ""} className={selectClass}>
          <option value="">Any luck level</option>
          <option value="low">○ Low luck</option>
          <option value="medium">◐ Medium luck</option>
          <option value="high">● High luck</option>
        </select>
        <input
          type="number"
          name="minPlays"
          defaultValue={minPlays}
          placeholder="Min times played"
          min={0}
          className="w-40 rounded-full border border-border bg-surface px-4 py-2 text-sm placeholder:text-muted"
        />
        <button
          type="submit"
          className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
        >
          Filter
        </button>
        {hasFilters && (
          <Link
            href="/library"
            className="flex items-center px-2 text-sm text-muted underline"
          >
            Clear
          </Link>
        )}
      </form>

      {games.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-muted">
          No games match. Try loosening the filters, or{" "}
          <Link href="/library/add" className="text-accent underline">
            add a game
          </Link>
          .
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {games.map((game) => (
            <li key={game.id}>
              <Link
                href={`/library/${game.id}`}
                className="block rounded-2xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-accent"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="font-display text-lg font-medium text-foreground">
                    {game.name}
                  </h2>
                  <span className="text-sm text-muted">
                    {game.yearPublished}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {game.minPlayers}–{game.maxPlayers} players ·{" "}
                  {game.playingTime} min
                  {game.bggRating ? ` · ★ ${game.bggRating.toFixed(1)}` : ""}
                  {game.isCooperative ? " · 🤝 co-op" : ""}
                  {" · "}
                  {game._count.plays === 0
                    ? "never played"
                    : `played ${game._count.plays}×`}
                </p>
                {(game.skillLevel || game.luckLevel) && (
                  <p className="mt-1 text-xs text-muted">
                    {game.skillLevel &&
                      `${LEVEL_DOTS[game.skillLevel]} ${game.skillLevel} skill`}
                    {game.skillLevel && game.luckLevel ? "  ·  " : ""}
                    {game.luckLevel &&
                      `${LEVEL_DOTS[game.luckLevel]} ${game.luckLevel} luck`}
                  </p>
                )}
                {game.vibeTags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {game.vibeTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-accent-soft px-3 py-1 text-xs text-accent"
                      >
                        {VIBE_EMOJI[tag as keyof typeof VIBE_EMOJI]}{" "}
                        {VIBE_LABELS[tag as keyof typeof VIBE_LABELS] ?? tag}
                      </span>
                    ))}
                  </div>
                )}
                {[...game.categories, ...game.mechanisms].length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {[...game.categories, ...game.mechanisms]
                      .slice(0, 5)
                      .map((label) => (
                        <span
                          key={label}
                          className="rounded-full bg-background px-2.5 py-0.5 text-xs text-muted"
                        >
                          {label}
                        </span>
                      ))}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
