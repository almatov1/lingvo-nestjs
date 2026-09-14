-- AlterEnum
ALTER TYPE "OnlineScreen" ADD VALUE 'LEVELS';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentLevel" "Level";
