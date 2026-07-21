import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { VIBE_EMOJI, VIBE_LABELS } from "@/lib/bgg/vibeHeuristic";
import { LEVEL_DOTS } from "@/lib/bgg/skillLuck";

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

  const [myRating, plays] = await Promise.all([
    prisma.rating.findUnique({
      where: { userId_gameId: { userId, gameId } },
    }),
    prisma.play.findMany({
      where: { gameId },
      orderBy: { playedAt: "desc" },
      include: {
        loggedByUser: { select: { name: true } },
        participants: { include: { user: { select: { name: true } } } },
      },
    }),
  ]);

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

  async function removeFromLibrary() {
    "use server";
    await prisma.game.update({
      where: { id: gameId },
      data: { inLibrary: false },
    });
    revalidatePath("/library");
    redirect("/library");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="flex items-center justify-between">
        <Link href="/library" className="text-sm text-muted underline">
          ← Library
        </Link>
        <form action={removeFromLibrary}>
          <button
            type="submit"
            className="text-xs text-muted underline hover:text-accent"
          >
            Remove from library
          </button>
        </form>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-semibold text-foreground">
          {game.name}
        </h1>
        <span className="text-sm text-muted">{game.yearPublished}</span>
      </div>

      <p className="mt-2 text-sm text-muted">
        {game.minPlayers}–{game.maxPlayers} players · {game.playingTime} min
        {game.bggRating ? ` · ★ ${game.bggRating.toFixed(1)}` : ""}
        {game.isCooperative ? " · 🤝 co-op" : ""}
        {" · "}
        {plays.length === 0
          ? "never played"
          : `played ${plays.length}×`}
      </p>
      {(game.skillLevel || game.luckLevel) && (
        <p className="mt-1 text-sm text-muted">
          {game.skillLevel &&
            `${LEVEL_DOTS[game.skillLevel]} ${game.skillLevel} skill`}
          {game.skillLevel && game.luckLevel ? "  ·  " : ""}
          {game.luckLevel &&
            `${LEVEL_DOTS[game.luckLevel]} ${game.luckLevel} luck`}
        </p>
      )}

      {game.description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground">
          {game.description}
        </p>
      )}

      {game.vibeTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
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

      {(game.categories.length > 0 || game.mechanisms.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[...game.categories, ...game.mechanisms].map((label) => (
            <span
              key={label}
              className="rounded-full bg-surface px-3 py-1 text-xs text-muted"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      <section className="mt-10 rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-display text-sm font-semibold text-foreground">
          Your rating
        </h2>
        <form action={saveRating} className="mt-3 flex items-center gap-2">
          <select
            name="rating"
            defaultValue={myRating?.rating ?? ""}
            className="rounded-full border border-border bg-background px-3 py-2 text-sm"
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
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground"
          >
            Save rating
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-sm font-semibold text-foreground">
          Game history
        </h2>
        {plays.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
            No plays logged yet.{" "}
            <Link href="/plays" className="text-accent underline">
              Log one
            </Link>
            .
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-3">
            {plays.map((play) => {
              const names = play.participants.map(
                (p) => p.user?.name ?? p.guestName ?? "?",
              );
              return (
                <li
                  key={play.id}
                  className="rounded-2xl border border-border bg-surface p-4 text-sm"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="font-medium text-foreground">
                      {play.playedAt.toISOString().slice(0, 10)}
                    </span>
                    {play.durationMinutes && (
                      <span className="text-xs text-muted">
                        {play.durationMinutes} min
                      </span>
                    )}
                  </div>
                  {names.length > 0 && (
                    <p className="mt-1 text-muted">with {names.join(", ")}</p>
                  )}
                  {play.notes && (
                    <p className="mt-1 text-xs text-muted">{play.notes}</p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    logged by {play.loggedByUser.name}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
