-- CreateEnum
CREATE TYPE "Language" AS ENUM ('kk', 'ru', 'en');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1');

-- CreateEnum
CREATE TYPE "Format" AS ENUM ('Online', 'Offline');

-- CreateEnum
CREATE TYPE "Step" AS ENUM ('CHOOSE_LANGUAGE', 'REGISTRATION', 'PLACEMENT_TEST', 'LEARNING_FORMAT', 'FORMAT_OFFLINE', 'FORMAT_ONLINE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('WRITING', 'READING', 'LISTENING', 'SPEAKING');

-- CreateEnum
CREATE TYPE "OnlineScreen" AS ENUM ('MENU', 'TOPICS', 'LESSON', 'TASKS');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "data" TEXT,
    "language" "Language" NOT NULL DEFAULT 'kk',
    "level" "Level",
    "format" "Format",
    "currentStep" "Step" NOT NULL DEFAULT 'CHOOSE_LANGUAGE',
    "testAnswers" INTEGER[],
    "currentTopic" INTEGER,
    "currentTask" "TaskType",
    "uiScreen" "OnlineScreen",
    "updatedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TopicResult" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "level" "Level" NOT NULL,
    "topic" INTEGER NOT NULL,
    "writingAnswer" TEXT,
    "readingAnswers" INTEGER[],
    "listeningAnswer" TEXT,
    "speakingFile" TEXT,
    "updatedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TopicResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");

-- CreateIndex
CREATE UNIQUE INDEX "TopicResult_userId_level_topic_key" ON "TopicResult"("userId", "level", "topic");

-- AddForeignKey
ALTER TABLE "TopicResult" ADD CONSTRAINT "TopicResult_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
