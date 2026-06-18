-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "pageType" TEXT NOT NULL DEFAULT 'products';

-- AlterTable
ALTER TABLE "category_highlights" ADD COLUMN     "mediaType" TEXT NOT NULL DEFAULT 'image';

-- CreateTable
CREATE TABLE "category_info_blocks" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "mediaUrl" TEXT,
    "mediaType" TEXT NOT NULL DEFAULT 'image',
    "textTheme" TEXT NOT NULL DEFAULT 'dark',
    "heading" TEXT,
    "body" TEXT,
    "layout" TEXT NOT NULL DEFAULT 'full',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "category_info_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_info_blocks_categoryId_sortOrder_idx" ON "category_info_blocks"("categoryId", "sortOrder");

-- AddForeignKey
ALTER TABLE "category_info_blocks" ADD CONSTRAINT "category_info_blocks_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
