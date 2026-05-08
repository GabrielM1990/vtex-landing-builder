-- CreateTable
CREATE TABLE "Landing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "blocks" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "deployedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Deployment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "landingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "commitSha" TEXT,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Deployment_landingId_fkey" FOREIGN KEY ("landingId") REFERENCES "Landing" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Landing_route_key" ON "Landing"("route");

-- CreateIndex
CREATE INDEX "Landing_status_idx" ON "Landing"("status");

-- CreateIndex
CREATE INDEX "Landing_route_idx" ON "Landing"("route");

-- CreateIndex
CREATE INDEX "Deployment_landingId_idx" ON "Deployment"("landingId");
