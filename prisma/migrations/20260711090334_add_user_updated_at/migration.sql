/*
  Warnings:

  - Added the required column `updatedAt` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "countryCode" TEXT,
    "birthDate" DATETIME,
    "belt" TEXT,
    "stripes" INTEGER,
    "blackBeltDegree" INTEGER,
    "blackBeltAwardedAt" DATETIME,
    "blackBeltProfessor" TEXT,
    "coachId" TEXT,
    CONSTRAINT "User_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("avatarUrl", "belt", "birthDate", "blackBeltAwardedAt", "blackBeltDegree", "blackBeltProfessor", "coachId", "countryCode", "createdAt", "email", "id", "name", "passwordHash", "role", "stripes") SELECT "avatarUrl", "belt", "birthDate", "blackBeltAwardedAt", "blackBeltDegree", "blackBeltProfessor", "coachId", "countryCode", "createdAt", "email", "id", "name", "passwordHash", "role", "stripes" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
