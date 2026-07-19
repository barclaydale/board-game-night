-- CreateEnum
CREATE TYPE "Level" AS ENUM ('low', 'medium', 'high');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "isCooperative" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "luckLevel" "Level",
ADD COLUMN     "skillLevel" "Level";
