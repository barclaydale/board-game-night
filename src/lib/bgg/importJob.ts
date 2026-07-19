import { prisma } from "@/lib/prisma";
import { fetchCollection, fetchThings } from "@/lib/bgg/client";
import { deriveVibeTags } from "@/lib/bgg/vibeHeuristic";

const DETAIL_BATCH_SIZE = 20;
const STALE_AFTER_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function startImportJob(bggUsername: string) {
  const job = await prisma.importJob.create({
    data: { bggUsername: bggUsername.trim() },
  });
  return { jobId: job.id };
}

export type ImportJobProgress =
  | { status: "pending_collection"; waitingOnBgg: boolean }
  | { status: "fetching_details"; cursor: number; totalGames: number }
  | { status: "complete"; totalGames: number }
  | { status: "error"; error: string };

export async function advanceImportJob(
  jobId: string,
): Promise<ImportJobProgress> {
  const job = await prisma.importJob.findUniqueOrThrow({
    where: { id: jobId },
  });

  if (job.status === "complete") {
    return { status: "complete", totalGames: job.totalGames ?? 0 };
  }
  if (job.status === "error") {
    return { status: "error", error: job.error ?? "Unknown error" };
  }

  if (job.status === "pending_collection") {
    const result = await fetchCollection(job.bggUsername);

    if (result.status === "pending") {
      return { status: "pending_collection", waitingOnBgg: true };
    }
    if (result.status === "error") {
      await prisma.importJob.update({
        where: { id: jobId },
        data: { status: "error", error: result.message },
      });
      return { status: "error", error: result.message };
    }

    for (const item of result.items) {
      if (!item.bggId) continue;
      await prisma.game.upsert({
        where: { bggId: item.bggId },
        create: {
          bggId: item.bggId,
          name: item.name,
          yearPublished: item.yearPublished,
          image: item.image,
          thumbnail: item.thumbnail,
          minPlayers: item.minPlayers,
          maxPlayers: item.maxPlayers,
          playingTime: item.playingTime,
          minPlayTime: item.minPlayTime,
          maxPlayTime: item.maxPlayTime,
          weight: item.weight,
          bggRating: item.bggRating,
          bggRank: item.bggRank,
          bggUsernames: [job.bggUsername],
          inLibrary: true,
          lastSyncedAt: new Date(0),
        },
        update: {
          name: item.name,
          yearPublished: item.yearPublished,
          image: item.image,
          thumbnail: item.thumbnail,
          minPlayers: item.minPlayers,
          maxPlayers: item.maxPlayers,
          playingTime: item.playingTime,
          minPlayTime: item.minPlayTime,
          maxPlayTime: item.maxPlayTime,
          weight: item.weight,
          bggRating: item.bggRating,
          bggRank: item.bggRank,
          inLibrary: true,
        },
      });

      // Ensure the owning username is recorded without clobbering others.
      const game = await prisma.game.findUnique({
        where: { bggId: item.bggId },
        select: { bggUsernames: true },
      });
      if (game && !game.bggUsernames.includes(job.bggUsername)) {
        await prisma.game.update({
          where: { bggId: item.bggId },
          data: { bggUsernames: { push: job.bggUsername } },
        });
      }
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: "fetching_details",
        cursor: 0,
        totalGames: result.items.length,
      },
    });

    return {
      status: "fetching_details",
      cursor: 0,
      totalGames: result.items.length,
    };
  }

  // fetching_details
  const staleCutoff = new Date(Date.now() - STALE_AFTER_MS);
  const candidates = await prisma.game.findMany({
    where: {
      bggUsernames: { has: job.bggUsername },
      lastSyncedAt: { lt: staleCutoff },
    },
    orderBy: { bggId: "asc" },
    take: DETAIL_BATCH_SIZE,
  });

  if (candidates.length === 0) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: { status: "complete", finishedAt: new Date() },
    });
    return { status: "complete", totalGames: job.totalGames ?? 0 };
  }

  const things = await fetchThings(candidates.map((g) => g.bggId));
  const thingsById = new Map(things.map((t) => [t.bggId, t]));

  for (const game of candidates) {
    const detail = thingsById.get(game.bggId);
    if (!detail) continue;

    const vibeTags = deriveVibeTags({
      categories: detail.categories,
      mechanisms: detail.mechanisms,
      weight: detail.weight ?? game.weight,
      playingTime: detail.playingTime ?? game.playingTime,
      maxPlayers: detail.maxPlayers ?? game.maxPlayers,
    });

    await prisma.game.update({
      where: { bggId: game.bggId },
      data: {
        description: detail.description,
        categories: detail.categories,
        mechanisms: detail.mechanisms,
        minPlayers: detail.minPlayers ?? game.minPlayers,
        maxPlayers: detail.maxPlayers ?? game.maxPlayers,
        playingTime: detail.playingTime ?? game.playingTime,
        minPlayTime: detail.minPlayTime ?? game.minPlayTime,
        maxPlayTime: detail.maxPlayTime ?? game.maxPlayTime,
        weight: detail.weight ?? game.weight,
        bggRating: detail.bggRating ?? game.bggRating,
        bggRank: detail.bggRank ?? game.bggRank,
        autoVibeTags: vibeTags,
        vibeTags: game.vibeTagsOverridden ? undefined : vibeTags,
        lastSyncedAt: new Date(),
      },
    });
  }

  const newCursor = job.cursor + candidates.length;
  const done = candidates.length < DETAIL_BATCH_SIZE;

  await prisma.importJob.update({
    where: { id: jobId },
    data: done
      ? { status: "complete", cursor: newCursor, finishedAt: new Date() }
      : { cursor: newCursor },
  });

  return done
    ? { status: "complete", totalGames: job.totalGames ?? 0 }
    : {
        status: "fetching_details",
        cursor: newCursor,
        totalGames: job.totalGames ?? 0,
      };
}
