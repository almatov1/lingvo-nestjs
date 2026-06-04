-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('READING', 'WRITING', 'LISTENING', 'SPEAKING');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentTask" "TaskType",
ADD COLUMN     "currentTopic" INTEGER;

-- CreateTable
CREATE TABLE "LessonResult" (
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

    CONSTRAINT "LessonResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonResult_userId_level_topic_key" ON "LessonResult"("userId", "level", "topic");

-- AddForeignKey
ALTER TABLE "LessonResult" ADD CONSTRAINT "LessonResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
