-- DropIndex
DROP INDEX "category_highlights_categoryId_sortOrder_idx";

-- AlterTable
ALTER TABLE "category_highlights" ADD COLUMN     "placement" TEXT NOT NULL DEFAULT 'menu';

-- CreateIndex
CREATE INDEX "category_highlights_categoryId_placement_sortOrder_idx" ON "category_highlights"("categoryId", "placement", "sortOrder");
