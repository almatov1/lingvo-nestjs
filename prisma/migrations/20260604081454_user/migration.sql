/*
  Warnings:

  - The values [WELCOME] on the enum `Step` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Step_new" AS ENUM ('CHOOSE_LANGUAGE', 'REGISTRATION', 'PLACEMENT_TEST', 'LEVEL_RESULT', 'LEARNING', 'COURSE_COMPLETE');
ALTER TABLE "public"."User" ALTER COLUMN "currentStep" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "currentStep" TYPE "Step_new" USING ("currentStep"::text::"Step_new");
ALTER TYPE "Step" RENAME TO "Step_old";
ALTER TYPE "Step_new" RENAME TO "Step";
DROP TYPE "public"."Step_old";
ALTER TABLE "User" ALTER COLUMN "currentStep" SET DEFAULT 'CHOOSE_LANGUAGE';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "currentStep" SET DEFAULT 'CHOOSE_LANGUAGE';
