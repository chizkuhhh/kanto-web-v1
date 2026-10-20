-- CreateTable
CREATE TABLE "AgentBibleVersion" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentBibleVersion_pkey" PRIMARY KEY ("id")
);