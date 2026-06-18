-- CreateTable
CREATE TABLE "site_config" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "fontFamily" TEXT NOT NULL DEFAULT 'default',
    "fontSize" INTEGER NOT NULL DEFAULT 16,
    "fontWeight" TEXT NOT NULL DEFAULT '400',
    "fontStyle" TEXT NOT NULL DEFAULT 'normal',
    "siteTitle" TEXT NOT NULL DEFAULT 'MURGDUR',
    "siteMotto" TEXT NOT NULL DEFAULT 'Maison Murgdur',
    "buttons" JSONB NOT NULL DEFAULT '[]',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_config_pkey" PRIMARY KEY ("id")
);
