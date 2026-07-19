import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const games = await prisma.game.findMany({
    where: { inLibrary: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Library</h1>
        <Link href="/" className="text-sm text-gray-500 underline">
          Home
        </Link>
      </div>

      {games.length === 0 ? (
        <p className="text-gray-500">No games yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {games.map((game) => (
            <li
              key={game.id}
              className="rounded-md border border-gray-200 p-4"
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
