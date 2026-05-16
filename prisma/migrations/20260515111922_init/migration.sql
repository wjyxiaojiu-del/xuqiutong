-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "company" TEXT NOT NULL DEFAULT '',
    "industry" TEXT NOT NULL DEFAULT '',
    "contactName" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT,
    "title" TEXT NOT NULL DEFAULT '',
    "rawInput" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'text',
    "scenario" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'P1',
    "extractedJson" TEXT NOT NULL DEFAULT '',
    "prdMarkdown" TEXT NOT NULL DEFAULT '',
    "mermaidCode" TEXT NOT NULL DEFAULT '',
    "aiModel" TEXT NOT NULL DEFAULT '',
    "rejectReason" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Requirement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "sectionKey" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RequirementVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "requirementId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "prdMarkdown" TEXT NOT NULL,
    "changeReason" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequirementVersion_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
