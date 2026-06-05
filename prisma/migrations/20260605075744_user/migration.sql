-- CreateEnum
CREATE TYPE "OnlineScreen" AS ENUM ('MENU', 'TOPICS', 'LESSON', 'TASKS');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "uiScreen" "OnlineScreen";
