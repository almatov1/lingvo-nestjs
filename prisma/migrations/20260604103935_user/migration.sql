-- CreateEnum
CREATE TYPE "Format" AS ENUM ('Online', 'Offline');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "format" "Format";
