-- AlterTable
ALTER TABLE "site_config" ADD COLUMN     "footerColumns" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "footerNote" TEXT NOT NULL DEFAULT '© 2026 Murgdur. All rights reserved.',
ADD COLUMN     "footerTagline" TEXT NOT NULL DEFAULT 'Luxury fashion crafted for the extraordinary.';
