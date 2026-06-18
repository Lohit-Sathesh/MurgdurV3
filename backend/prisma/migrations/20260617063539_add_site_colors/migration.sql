-- AlterTable
ALTER TABLE "site_config" ADD COLUMN     "colorBg" TEXT NOT NULL DEFAULT '#ffffff',
ADD COLUMN     "colorGold" TEXT NOT NULL DEFAULT '#c9a96e',
ADD COLUMN     "colorMuted" TEXT NOT NULL DEFAULT '#6f6c64',
ADD COLUMN     "colorText" TEXT NOT NULL DEFAULT '#1a1a1a';
