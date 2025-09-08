-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phoneE164" TEXT NOT NULL,
    "email" TEXT,
    "state" TEXT,
    "timezone" TEXT,
    "consentText" TEXT NOT NULL,
    "consentTimestamp" DATETIME NOT NULL,
    "consentIp" TEXT,
    "consentPageUrl" TEXT,
    "trustedFormToken" TEXT,
    "expressWrittenConsent" BOOLEAN NOT NULL DEFAULT false,
    "lastAttemptAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT
);

-- CreateTable
CREATE TABLE "Call" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "leadId" TEXT NOT NULL,
    "providerCallSid" TEXT,
    "transcript" TEXT,
    "sentiment" REAL,
    "intent" TEXT,
    "outcome" TEXT NOT NULL DEFAULT 'NoAnswer',
    "transferred" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Call_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Suppression" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "phoneE164" TEXT NOT NULL,
    "reason" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_phoneE164_key" ON "Lead"("phoneE164");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_trustedFormToken_key" ON "Lead"("trustedFormToken");

-- CreateIndex
CREATE UNIQUE INDEX "Call_providerCallSid_key" ON "Call"("providerCallSid");

-- CreateIndex
CREATE UNIQUE INDEX "Suppression_phoneE164_key" ON "Suppression"("phoneE164");
