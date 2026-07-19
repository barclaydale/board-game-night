import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { VIBE_TAGS } from "@/lib/bgg/vibeHeuristic";

export const dynamic = "force-dynamic";

interface LibraryPageProps {
  searchParams: Promise<{
    q?: string;
    vibe?: string;
    players?: string;
    maxDuration?: string;
    minRating?: string;
    coop?: string;
    skill?: string;
    luck?: string;
  }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { q, vibe, players, maxDuration, minRating, coop, skill, luck } =
    await searchParams;

  const where: Prisma.GameWhereInput = { inLibrary: true };

  if (q) {
    where.name = { contains: q, mode: "insensitive" };
  }
  if (vibe) {
    where.vibeTags = { has: vibe };
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

  const games = await prisma.game.findMany({
    where,
    orderBy: { name: "asc" },
  });

  const hasFilters =
    q || vibe || players || maxDuration || minRating || coop || skill || luck;

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Library</h1>
        <div className="flex gap-4 text-sm text-gray-500">
          <Link href="/recommend" className="underline">
            Recommend
          </Link>
          <Link href="/settings/import" className="underline">
            Import from BGG
          </Link>
          <Link href="/" className="underline">
            Home
          </Link>
        </div>
      </div>

      <form className="mb-8 flex flex-wrap gap-2" action="/library">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search by name"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          name="vibe"
          defaultValue={vibe ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Any vibe</option>
          {VIBE_TAGS.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="players"
          defaultValue={players}
          placeholder="# players"
          min={1}
          className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          name="maxDuration"
          defaultValue={maxDuration}
          placeholder="Max minutes"
          min={5}
          step={5}
          className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          name="minRating"
          defaultValue={minRating}
          placeholder="Min BGG rating"
          min={1}
          max={10}
          step={0.5}
          className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <select
          name="coop"
          defaultValue={coop ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Co-op or competitive</option>
          <option value="coop">Co-op</option>
          <option value="competitive">Competitive</option>
        </select>
        <select
          name="skill"
          defaultValue={skill ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Any skill level</option>
          <option value="low">Low skill</option>
          <option value="medium">Medium skill</option>
          <option value="high">High skill</option>
        </select>
        <select
          name="luck"
          defaultValue={luck ?? ""}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Any luck level</option>
          <option value="low">Low luck</option>
          <option value="medium">Medium luck</option>
          <option value="high">High luck</option>
        </select>
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm"
        >
          Filter
        </button>
        {hasFilters && (
          <Link
            href="/library"
            className="flex items-center px-2 text-sm text-gray-500 underline"
          >
            Clear
          </Link>
        )}
      </form>

      {games.length === 0 ? (
        <p className="text-gray-500">No games match.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {games.map((game) => (
            <li key={game.id}>
              <Link
                href={`/library/${game.id}`}
                className="block rounded-md border border-gray-200 p-4 hover:border-gray-400"
              >
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-medium">{game.name}</h2>
                  <span className="text-sm text-gray-500">
                    {game.yearPublished}
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">
                  {game.minPlayers}–{game.maxPlayers} players ·{" "}
                  {game.playingTime} min
                  {game.bggRating
                    ? ` · BGG ${game.bggRating.toFixed(1)}`
                    : ""}
                  {game.isCooperative ? " · co-op" : ""}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {game.skillLevel ? `${game.skillLevel} skill` : ""}
                  {game.skillLevel && game.luckLevel ? " · " : ""}
                  {game.luckLevel ? `${game.luckLevel} luck` : ""}
                </p>
                {game.vibeTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {game.vibeTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
                      >
                        {tag}
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
