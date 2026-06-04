/*
  Warnings:

  - Made the column `language` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "User" ALTER COLUMN "language" SET NOT NULL,
ALTER COLUMN "language" SET DEFAULT 'kk';
