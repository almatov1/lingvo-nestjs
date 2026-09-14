/*
  Warnings:

  - The values [LESSON] on the enum `OnlineScreen` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OnlineScreen_new" AS ENUM ('MENU', 'LEVELS', 'TOPICS', 'TASK', 'TASKS');
ALTER TABLE "User" ALTER COLUMN "uiScreen" TYPE "OnlineScreen_new" USING ("uiScreen"::text::"OnlineScreen_new");
ALTER TYPE "OnlineScreen" RENAME TO "OnlineScreen_old";
ALTER TYPE "OnlineScreen_new" RENAME TO "OnlineScreen";
DROP TYPE "public"."OnlineScreen_old";
COMMIT;
