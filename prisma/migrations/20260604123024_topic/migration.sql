/*
  Warnings:

  - You are about to drop the `LessonResult` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "LessonResult" DROP CONSTRAINT "LessonResult_userId_fkey";

-- DropTable
DROP TABLE "LessonResult";

-- CreateTable
CREATE TABLE "TopicResult" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "level" "Level" NOT NULL,
    "topic" INTEGER NOT NULL,
    "readingAnswers" INTEGER[],
    "writingAnswer" TEXT,
    "listeningAnswers" INTEGER[],
    "speakingFile" TEXT,
    "updatedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopicResult_userId_level_topic_key" ON "TopicResult"("userId", "level", "topic");

-- AddForeignKey
ALTER TABLE "TopicResult" ADD CONSTRAINT "TopicResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
