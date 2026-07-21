/*
  Warnings:

  - You are about to drop the column `bggUsernames` on the `Game` table. All the data in the column will be lost.
  - You are about to drop the `ImportJob` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Game" DROP COLUMN "bggUsernames";

-- DropTable
DROP TABLE "ImportJob";

-- DropEnum
DROP TYPE "ImportJobStatus";
