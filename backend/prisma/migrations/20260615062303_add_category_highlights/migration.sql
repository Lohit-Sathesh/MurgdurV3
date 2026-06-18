-- CreateTable
CREATE TABLE "category_highlights" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subheading" TEXT,
    "linkUrl" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_highlights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_highlights_categoryId_sortOrder_idx" ON "category_highlights"("categoryId", "sortOrder");

-- AddForeignKey
ALTER TABLE "category_highlights" ADD CONSTRAINT "category_highlights_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
