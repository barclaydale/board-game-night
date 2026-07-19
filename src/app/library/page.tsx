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
    maxWeight?: string;
  }>;
}

export default async function LibraryPage({ searchParams }: LibraryPageProps) {
  const { q, vibe, players, maxWeight } = await searchParams;

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
  if (maxWeight) {
    const w = Number(maxWeight);
    if (Number.isFinite(w)) {
      where.weight = { lte: w };
    }
  }

  const games = await prisma.game.findMany({
    where,
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Library</h1>
        <div className="flex gap-4 text-sm text-gray-500">
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
          className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          type="number"
          name="maxWeight"
          defaultValue={maxWeight}
          placeholder="Max weight"
          min={1}
          max={5}
          step={0.1}
          className="w-28 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm"
        >
          Filter
        </button>
        {(q || vibe || players || maxWeight) && (
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
                  {game.playingTime} min · weight {game.weight?.toFixed(1)}
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
