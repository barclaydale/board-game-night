"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchSearch, fetchThings } from "@/lib/bgg/client";
import { deriveVibeTags } from "@/lib/bgg/vibeHeuristic";
import {
  deriveSkillLevel,
  deriveLuckLevel,
  deriveIsCooperative,
} from "@/lib/bgg/skillLuck";
import {
  DETAIL_BATCH_SIZE,
  type SearchListItem,
  type GameDetails,
} from "./types";

function nameMatchRank(name: string, query: string): number {
  const n = name.toLowerCase();
  const q = query.toLowerCase();
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  if (n.includes(q)) return 2;
  return 3;
}

/** Returns every matching game (name + year only), with close name matches
 * ranked first so the base game surfaces above its expansions/variants. */
export async function searchBggGames(
  query: string,
): Promise<SearchListItem[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!query.trim()) return [];

  const results = await fetchSearch(query.trim());
  const trimmedQuery = query.trim();

  return [...results].sort((a, b) => {
    const rankDiff =
      nameMatchRank(a.name, trimmedQuery) - nameMatchRank(b.name, trimmedQuery);
    if (rankDiff !== 0) return rankDiff;
    return (b.yearPublished ?? 0) - (a.yearPublished ?? 0);
  });
}

/** Fetches full details (rating, description, players, etc.) for up to
 * DETAIL_BATCH_SIZE game ids at a time. */
export async function getGameDetails(
  bggIds: number[],
): Promise<GameDetails[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const batch = bggIds.slice(0, DETAIL_BATCH_SIZE);
  if (batch.length === 0) return [];

  const [details, existing] = await Promise.all([
    fetchThings(batch),
    prisma.game.findMany({
      where: { bggId: { in: batch } },
      select: { bggId: true, inLibrary: true },
    }),
  ]);

  const inLibraryIds = new Set(
    existing.filter((g) => g.inLibrary).map((g) => g.bggId),
  );

  return details.map((d) => ({
    bggId: d.bggId,
    name: d.name,
    yearPublished: d.yearPublished,
    image: d.image,
    thumbnail: d.thumbnail,
    description: d.description,
    minPlayers: d.minPlayers,
    maxPlayers: d.maxPlayers,
    playingTime: d.playingTime,
    weight: d.weight,
    bggRating: d.bggRating,
    alreadyInLibrary: inLibraryIds.has(d.bggId),
  }));
}

export async function addGameToLibrary(bggId: number): Promise<{ gameId: string }> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const existing = await prisma.game.findUnique({ where: { bggId } });
  if (existing) {
    if (!existing.inLibrary) {
      await prisma.game.update({
        where: { bggId },
        data: { inLibrary: true },
      });
    }
    return { gameId: existing.id };
  }

  const [detail] = await fetchThings([bggId]);
  if (!detail) {
    throw new Error("Couldn't find that game on BoardGameGeek");
  }

  const vibeTags = deriveVibeTags({
    categories: detail.categories,
    mechanisms: detail.mechanisms,
    description: detail.description,
    weight: detail.weight,
    playingTime: detail.playingTime,
    maxPlayers: detail.maxPlayers,
  });

  const game = await prisma.game.create({
    data: {
      bggId: detail.bggId,
      name: detail.name,
      yearPublished: detail.yearPublished,
      image: detail.image,
      thumbnail: detail.thumbnail,
      minPlayers: detail.minPlayers,
      maxPlayers: detail.maxPlayers,
      playingTime: detail.playingTime,
      minPlayTime: detail.minPlayTime,
      maxPlayTime: detail.maxPlayTime,
      weight: detail.weight,
      bggRating: detail.bggRating,
      bggRank: detail.bggRank,
      description: detail.description,
      categories: detail.categories,
      mechanisms: detail.mechanisms,
      vibeTags,
      skillLevel: deriveSkillLevel({
        mechanisms: detail.mechanisms,
        weight: detail.weight,
      }),
      luckLevel: deriveLuckLevel({
        mechanisms: detail.mechanisms,
        weight: detail.weight,
      }),
      isCooperative: deriveIsCooperative(detail.mechanisms),
      inLibrary: true,
      lastSyncedAt: new Date(),
    },
  });

  return { gameId: game.id };
}
