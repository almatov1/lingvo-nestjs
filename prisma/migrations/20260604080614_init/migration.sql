-- CreateEnum
CREATE TYPE "Language" AS ENUM ('kk', 'ru', 'en');

-- CreateEnum
CREATE TYPE "Level" AS ENUM ('A1', 'A2', 'B1', 'B2', 'C1');

-- CreateEnum
CREATE TYPE "Step" AS ENUM ('WELCOME', 'CHOOSE_LANGUAGE', 'REGISTRATION', 'PLACEMENT_TEST', 'LEVEL_RESULT', 'LEARNING', 'COURSE_COMPLETE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "telegramId" BIGINT NOT NULL,
    "data" TEXT,
    "language" "Language",
    "level" "Level",
    "currentStep" "Step" NOT NULL DEFAULT 'WELCOME',
    "testAnswers" INTEGER[],
    "updatedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_telegramId_key" ON "User"("telegramId");
