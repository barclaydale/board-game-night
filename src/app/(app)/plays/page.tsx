import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function PlaysPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [games, users, plays] = await Promise.all([
    prisma.game.findMany({
      where: { inLibrary: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.play.findMany({
      orderBy: { playedAt: "desc" },
      take: 50,
      include: {
        game: { select: { id: true, name: true } },
        loggedByUser: { select: { name: true } },
        participants: {
          include: { user: { select: { name: true } } },
        },
      },
    }),
  ]);

  async function logPlay(formData: FormData) {
    "use server";
    const session = await auth();
    const loggedByUserId = session?.user?.id;
    if (!loggedByUserId) return;

    const gameId = formData.get("gameId") as string;
    if (!gameId) return;

    const dateStr = formData.get("playedAt") as string;
    const playedAt = dateStr ? new Date(dateStr) : new Date();

    const durationRaw = formData.get("durationMinutes") as string;
    const durationMinutes = durationRaw ? Number(durationRaw) : null;

    const notes = (formData.get("notes") as string) || null;

    const participantUserIds = formData.getAll("participants") as string[];
    const guestNamesRaw = (formData.get("guestNames") as string) || "";
    const guestNames = guestNamesRaw
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    await prisma.play.create({
      data: {
        gameId,
        playedAt,
        durationMinutes: Number.isFinite(durationMinutes)
          ? durationMinutes
          : null,
        notes,
        loggedByUserId,
        participants: {
          create: [
            ...participantUserIds.map((uid) => ({ userId: uid })),
            ...guestNames.map((guestName) => ({ guestName })),
          ],
        },
      },
    });

    revalidatePath("/plays");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        📝 Play history
      </h1>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-sm font-semibold text-foreground">
          Log a play
        </h2>
        <form action={logPlay} className="mt-3 flex flex-col gap-3">
          <select
            name="gameId"
            required
            defaultValue=""
            className="rounded-full border border-border bg-background px-4 py-2 text-sm"
          >
            <option value="" disabled>
              Which game?
            </option>
            {games.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <div className="flex gap-3">
            <input
              type="date"
              name="playedAt"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className="rounded-full border border-border bg-background px-4 py-2 text-sm"
            />
            <input
              type="number"
              name="durationMinutes"
              placeholder="Duration (min)"
              min={1}
              className="w-40 rounded-full border border-border bg-background px-4 py-2 text-sm placeholder:text-muted"
            />
          </div>

          <fieldset className="text-sm text-foreground">
            <legend className="mb-1 text-muted">Who played?</legend>
            {users.map((u) => (
              <label
                key={u.id}
                className="mr-4 inline-flex items-center gap-1"
              >
                <input
                  type="checkbox"
                  name="participants"
                  value={u.id}
                  className="accent-[var(--accent)]"
                />
                {u.name}
              </label>
            ))}
          </fieldset>

          <input
            type="text"
            name="guestNames"
            placeholder="Guests (comma separated)"
            className="rounded-full border border-border bg-background px-4 py-2 text-sm placeholder:text-muted"
          />

          <textarea
            name="notes"
            placeholder="Notes (optional)"
            rows={2}
            className="rounded-2xl border border-border bg-background px-4 py-2 text-sm placeholder:text-muted"
          />

          <button
            type="submit"
            className="w-fit rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground"
          >
            Log play
          </button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-sm font-semibold text-foreground">
          History
        </h2>
        {plays.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-dashed border-border bg-surface p-8 text-center text-muted">
            No plays logged yet — log your first one above.
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
                    <Link
                      href={`/library/${play.game.id}`}
                      className="font-display font-medium text-foreground underline"
                    >
                      {play.game.name}
                    </Link>
                    <span className="text-xs text-muted">
                      {play.playedAt.toISOString().slice(0, 10)}
                    </span>
                  </div>
                  {names.length > 0 && (
                    <p className="mt-1 text-muted">with {names.join(", ")}</p>
                  )}
                  {play.durationMinutes && (
                    <p className="mt-1 text-xs text-muted">
                      {play.durationMinutes} min
                    </p>
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
