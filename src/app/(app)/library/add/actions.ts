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
import type { SearchItem } from "@/lib/bgg/xml";

export interface SearchResultItem extends SearchItem {
  alreadyInLibrary: boolean;
}

export async function searchBggGames(
  query: string,
): Promise<SearchResultItem[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!query.trim()) return [];

  const results = await fetchSearch(query.trim());
  const top = results.slice(0, 20);

  const existing = await prisma.game.findMany({
    where: { bggId: { in: top.map((r) => r.bggId) } },
    select: { bggId: true, inLibrary: true },
  });
  const inLibraryIds = new Set(
    existing.filter((g) => g.inLibrary).map((g) => g.bggId),
  );

  return top.map((r) => ({ ...r, alreadyInLibrary: inLibraryIds.has(r.bggId) }));
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
      autoVibeTags: vibeTags,
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
