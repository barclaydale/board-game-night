import type { Game } from "@prisma/client";
import type { VibeTag } from "@/lib/bgg/vibeHeuristic";

export interface RecommendAnswers {
  players: number;
  timeBucket: "30" | "60" | "120plus";
  vibe: VibeTag;
  complexity: "easy" | "willing";
  teamStyle: "coop" | "team" | "ffa";
  favorMode: "surprise" | "known";
}

export interface PlayInfo {
  gameId: string;
  playedAt: Date;
}

export interface RatingInfo {
  gameId: string;
  userId: string;
  rating: number;
}

export interface ScoredGame {
  game: Game;
  score: number;
  reasons: string[];
}

const RECENCY_WINDOW_DAYS = 30;
const PLAYER_COUNT_TOLERANCE = 1;

function timeBucketFits(
  playingTime: number | null,
  bucket: RecommendAnswers["timeBucket"],
): boolean {
  if (playingTime === null) return true;
  if (bucket === "30") return playingTime <= 45;
  if (bucket === "60") return playingTime <= 90;
  return true;
}

export function scoreGames(
  games: Game[],
  plays: PlayInfo[],
  ratings: RatingInfo[],
  answers: RecommendAnswers,
  currentUserId: string,
): ScoredGame[] {
  const now = Date.now();

  const playsByGame = new Map<string, PlayInfo[]>();
  for (const p of plays) {
    const list = playsByGame.get(p.gameId) ?? [];
    list.push(p);
    playsByGame.set(p.gameId, list);
  }

  const ratingsByGame = new Map<string, RatingInfo[]>();
  for (const r of ratings) {
    const list = ratingsByGame.get(r.gameId) ?? [];
    list.push(r);
    ratingsByGame.set(r.gameId, list);
  }

  const scored: ScoredGame[] = [];

  for (const game of games) {
    if (!game.inLibrary) continue;
    if (
      game.minPlayers !== null &&
      answers.players < game.minPlayers - PLAYER_COUNT_TOLERANCE
    ) {
      continue;
    }
    if (
      game.maxPlayers !== null &&
      answers.players > game.maxPlayers + PLAYER_COUNT_TOLERANCE
    ) {
      continue;
    }

    let score = 0;
    const reasons: string[] = [];

    if (game.vibeTags.includes(answers.vibe)) {
      score += 10;
      reasons.push(`matches the ${answers.vibe} vibe`);
    }

    if (answers.complexity === "easy") {
      if (game.skillLevel === "low") {
        score += 4;
        reasons.push("easy to teach");
      } else if (game.skillLevel === "high") {
        score -= 4;
      }
    } else if (game.skillLevel === "high") {
      score += 2;
      reasons.push("has some depth");
    }

    if (timeBucketFits(game.playingTime, answers.timeBucket)) {
      score += 2;
    } else {
      score -= 3;
    }

    const isTeamBased = game.mechanisms.includes("Team-Based Game");
    if (answers.teamStyle === "coop") {
      if (game.isCooperative) {
        score += 6;
        reasons.push("cooperative");
      } else {
        score -= 6;
      }
    } else if (answers.teamStyle === "team") {
      if (game.isCooperative) score -= 4;
      if (isTeamBased) {
        score += 4;
        reasons.push("team-based");
      }
    } else {
      if (game.isCooperative) score -= 4;
      if (isTeamBased) score -= 2;
    }

    const gamePlays = playsByGame.get(game.id) ?? [];
    const gameRatings = ratingsByGame.get(game.id) ?? [];
    const myRating = gameRatings.find((r) => r.userId === currentUserId);
    const playedBefore = gamePlays.length > 0;

    if (answers.favorMode === "surprise") {
      if (!playedBefore) {
        score += 3;
        reasons.push("something new");
      }
    } else {
      if (playedBefore) {
        score += 3;
        reasons.push("a familiar favorite");
      }
      if (myRating) {
        score += myRating.rating / 2;
      }
    }

    const mostRecentPlay = gamePlays.reduce<Date | null>(
      (latest, p) => (!latest || p.playedAt > latest ? p.playedAt : latest),
      null,
    );
    if (mostRecentPlay) {
      const daysAgo = (now - mostRecentPlay.getTime()) / (1000 * 60 * 60 * 24);
      if (daysAgo < RECENCY_WINDOW_DAYS) {
        const penalty = (1 - daysAgo / RECENCY_WINDOW_DAYS) * 5;
        score -= penalty;
        if (penalty > 2) {
          reasons.push("played recently");
        }
      }
    }

    if (gameRatings.length > 0) {
      const avg =
        gameRatings.reduce((sum, r) => sum + r.rating, 0) /
        gameRatings.length;
      score += avg / 5;
    }

    scored.push({ game, score, reasons });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored;
}
