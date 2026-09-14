/*
  Warnings:

  - You are about to drop the column `readingAnswers` on the `TopicResult` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TopicResult" DROP COLUMN "readingAnswers",
ADD COLUMN     "readingAnswer" TEXT[];
