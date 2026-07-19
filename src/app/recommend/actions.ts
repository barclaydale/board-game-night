"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  scoreGames,
  type RecommendAnswers,
  type ScoredGame,
} from "@/lib/recommend/scoring";

export async function getRecommendations(
  answers: RecommendAnswers,
): Promise<ScoredGame[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const [games, plays, ratings] = await Promise.all([
    prisma.game.findMany({ where: { inLibrary: true } }),
    prisma.play.findMany({ select: { gameId: true, playedAt: true } }),
    prisma.rating.findMany({
      select: { gameId: true, userId: true, rating: true },
    }),
  ]);

  const scored = scoreGames(games, plays, ratings, answers, userId);
  return scored.slice(0, 5);
}
