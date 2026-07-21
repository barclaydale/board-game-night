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

// BGG's /thing endpoint hard-caps requests at 20 ids ("Cannot load more than 20 items").
const MAX_CANDIDATES = 20;

export interface SearchResultItem {
  bggId: number;
  name: string;
  yearPublished: number | null;
  image: string | null;
  thumbnail: string | null;
  description: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playingTime: number | null;
  weight: number | null;
  bggRating: number | null;
  alreadyInLibrary: boolean;
}

export async function searchBggGames(
  query: string,
): Promise<SearchResultItem[]> {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  if (!query.trim()) return [];

  const results = await fetchSearch(query.trim());
  const candidates = results.slice(0, MAX_CANDIDATES);
  if (candidates.length === 0) return [];

  const [details, existing] = await Promise.all([
    fetchThings(candidates.map((c) => c.bggId)),
    prisma.game.findMany({
      where: { bggId: { in: candidates.map((c) => c.bggId) } },
      select: { bggId: true, inLibrary: true },
    }),
  ]);

  const detailsById = new Map(details.map((d) => [d.bggId, d]));
  const inLibraryIds = new Set(
    existing.filter((g) => g.inLibrary).map((g) => g.bggId),
  );

  return candidates.map((c) => {
    const d = detailsById.get(c.bggId);
    return {
      bggId: c.bggId,
      name: d?.name ?? c.name,
      yearPublished: c.yearPublished,
      image: d?.image ?? null,
      thumbnail: d?.thumbnail ?? null,
      description: d?.description ?? null,
      minPlayers: d?.minPlayers ?? null,
      maxPlayers: d?.maxPlayers ?? null,
      playingTime: d?.playingTime ?? null,
      weight: d?.weight ?? null,
      bggRating: d?.bggRating ?? null,
      alreadyInLibrary: inLibraryIds.has(c.bggId),
    };
  });
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
