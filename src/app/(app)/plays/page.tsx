import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { LogPlayForm } from "./LogPlayForm";
import { getParticipantNames } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlaysPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [games, participantNames, plays] = await Promise.all([
    prisma.game.findMany({
      where: { inLibrary: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    getParticipantNames(),
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

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="font-display text-2xl font-semibold text-foreground">
        📝 Play history
      </h1>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-sm font-semibold text-foreground">
          Log a play
        </h2>
        <LogPlayForm games={games} participantNames={participantNames} />
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
              const sortedParticipants = [...play.participants].sort(
                (a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity),
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
                  {sortedParticipants.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-0.5">
                      {sortedParticipants.map((p) => (
                        <li
                          key={p.id}
                          className="flex items-baseline justify-between text-muted"
                        >
                          <span>
                            {p.user?.name ?? p.guestName ?? "?"}
                            {p.notes ? ` — ${p.notes}` : ""}
                          </span>
                          {p.score !== null && (
                            <span className="ml-2 shrink-0 text-foreground">
                              {p.score}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
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
