"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export interface ParticipantInput {
  name: string;
  score: number | null;
  notes: string;
}

export interface LogPlayInput {
  gameId: string;
  playedAt: string;
  durationMinutes: number | null;
  notes: string | null;
  participants: ParticipantInput[];
}

/** Every name that's ever appeared in play history -- registered users
 * and past guests alike -- for the name field's autocomplete list. */
export async function getParticipantNames(): Promise<string[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const [users, guestRows] = await Promise.all([
    prisma.user.findMany({ select: { name: true } }),
    prisma.playParticipant.findMany({
      where: { guestName: { not: null } },
      select: { guestName: true },
      distinct: ["guestName"],
    }),
  ]);

  const names = new Set<string>();
  for (const u of users) if (u.name) names.add(u.name);
  for (const g of guestRows) if (g.guestName) names.add(g.guestName);

  return Array.from(names).sort();
}

export async function logPlay(input: LogPlayInput): Promise<void> {
  const session = await auth();
  const loggedByUserId = session?.user?.id;
  if (!loggedByUserId) throw new Error("Unauthorized");
  if (!input.gameId) throw new Error("A game is required");

  const validParticipants = input.participants.filter((p) => p.name.trim());

  const users = await prisma.user.findMany({
    select: { id: true, name: true },
  });
  const userIdByLowerName = new Map(
    users.filter((u) => u.name).map((u) => [u.name!.toLowerCase(), u.id]),
  );

  const playedAt = input.playedAt ? new Date(input.playedAt) : new Date();

  await prisma.play.create({
    data: {
      gameId: input.gameId,
      playedAt,
      durationMinutes: input.durationMinutes,
      notes: input.notes,
      loggedByUserId,
      participants: {
        create: validParticipants.map((p) => {
          const name = p.name.trim();
          const matchedUserId = userIdByLowerName.get(name.toLowerCase());
          return {
            userId: matchedUserId ?? null,
            guestName: matchedUserId ? null : name,
            score: p.score,
            notes: p.notes.trim() || null,
          };
        }),
      },
    },
  });

  revalidatePath("/plays");
  revalidatePath("/library");
}
