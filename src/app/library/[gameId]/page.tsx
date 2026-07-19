import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { VIBE_TAGS, type VibeTag } from "@/lib/bgg/vibeHeuristic";

interface GameDetailPageProps {
  params: Promise<{ gameId: string }>;
}

export default async function GameDetailPage({
  params,
}: GameDetailPageProps) {
  const { gameId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) notFound();

  const myRating = await prisma.rating.findUnique({
    where: { userId_gameId: { userId, gameId } },
  });

  async function saveVibeTags(formData: FormData) {
    "use server";
    const tags = formData.getAll("vibeTags") as VibeTag[];
    await prisma.game.update({
      where: { id: gameId },
      data: { vibeTags: tags, vibeTagsOverridden: true },
    });
    revalidatePath(`/library/${gameId}`);
    revalidatePath("/library");
  }

  async function saveRating(formData: FormData) {
    "use server";
    const session = await auth();
    const ratingUserId = session?.user?.id;
    const rating = Number(formData.get("rating"));
    if (!ratingUserId || !Number.isFinite(rating)) return;

    await prisma.rating.upsert({
      where: {
        userId_gameId: { userId: ratingUserId, gameId },
      },
      create: { userId: ratingUserId, gameId, rating },
      update: { rating },
    });
    revalidatePath(`/library/${gameId}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/library" className="text-sm text-gray-500 underline">
        ← Library
      </Link>

      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{game.name}</h1>
        <span className="text-sm text-gray-500">{game.yearPublished}</span>
      </div>

      <p className="mt-1 text-sm text-gray-600">
        {game.minPlayers}–{game.maxPlayers} players · {game.playingTime} min ·
        weight {game.weight?.toFixed(1) ?? "—"}
        {game.bggRating ? ` · BGG rating ${game.bggRating.toFixed(1)}` : ""}
      </p>

      {game.description && (
        <p className="mt-4 whitespace-pre-line text-sm text-gray-700">
          {game.description}
        </p>
      )}

      {(game.categories.length > 0 || game.mechanisms.length > 0) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {[...game.categories, ...game.mechanisms].map((label) => (
            <span
              key={label}
              className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">Vibe tags</h2>
        <form action={saveVibeTags} className="mt-2 flex flex-col gap-2">
          {VIBE_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="vibeTags"
                value={tag}
                defaultChecked={game.vibeTags.includes(tag)}
              />
              {tag}
            </label>
          ))}
          <button
            type="submit"
            className="mt-2 w-fit rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            Save vibe tags
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-gray-700">Your rating</h2>
        <form action={saveRating} className="mt-2 flex items-center gap-2">
          <select
            name="rating"
            defaultValue={myRating?.rating ?? ""}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Rate 1–10
            </option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
          >
            Save rating
          </button>
        </form>
      </section>
    </div>
  );
}
