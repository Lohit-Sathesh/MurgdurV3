-- CreateTable
CREATE TABLE "homepage_slides" (
    "id" TEXT NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "headline" TEXT NOT NULL,
    "subheading" TEXT,
    "linkUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "homepage_slides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "homepage_slides_isActive_sortOrder_idx" ON "homepage_slides"("isActive", "sortOrder");
