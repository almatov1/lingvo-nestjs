/*
  Warnings:

  - You are about to drop the column `listeningAnswers` on the `TopicResult` table. All the data in the column will be lost.
  - You are about to drop the column `readingAnswer` on the `TopicResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TopicResult" DROP COLUMN "listeningAnswers",
DROP COLUMN "readingAnswer",
ADD COLUMN     "listeningAnswer" TEXT,
ADD COLUMN     "readingAnswers" INTEGER[];
