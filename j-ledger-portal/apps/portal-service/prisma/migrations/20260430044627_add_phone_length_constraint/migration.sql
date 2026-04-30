/*
  Warnings:

  - You are about to alter the column `phoneNumber` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(15)`.

*/
-- AlterTable
ALTER TABLE "identity"."users" ALTER COLUMN "phoneNumber" SET DATA TYPE VARCHAR(15);
