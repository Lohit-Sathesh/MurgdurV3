-- AlterTable
ALTER TABLE "site_config" ADD COLUMN     "homepageSections" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "sizeGuideContactLinkText" TEXT NOT NULL DEFAULT 'Contact our stylists',
ADD COLUMN     "sizeGuideContactLinkUrl" TEXT NOT NULL DEFAULT '/contact',
ADD COLUMN     "sizeGuideContactText" TEXT NOT NULL DEFAULT 'Need help with sizing?';
