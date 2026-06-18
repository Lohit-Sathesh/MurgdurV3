import { PrismaClient } from '@prisma/client';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp = require('sharp');
import https = require('https');
import fs = require('fs');
import path = require('path');
import { MeiliSearch } from 'meilisearch';
import { CATEGORY_SEEDS, COLOR_HEX } from './seed-data';

const imageResults: Record<string, string[]> = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'image-search-results.json'), 'utf8'),
);

const prisma = new PrismaClient();

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const SIZES = [
  { suffix: 'hero', width: 1200 },
  { suffix: 'medium', width: 800 },
  { suffix: 'thumb', width: 400 },
];

function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'MurgdurSeedScript/1.0' } }, res => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        downloadBuffer(res.headers.location).then(resolve, reject);
        return;
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function uploadImage(buffer: Buffer, slug: string, index: number): Promise<string> {
  let heroUrl = '';
  for (const { suffix, width } of SIZES) {
    const webp = await sharp(buffer).resize(width).webp({ quality: 90 }).toBuffer();
    const key = `products/${slug}/${index}-${suffix}.webp`;
    await r2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: webp,
      ContentType: 'image/webp',
    }));
    const url = `${process.env.R2_PUBLIC_CDN_URL}/${key}`;
    if (suffix === 'hero') heroUrl = url;
  }
  return heroUrl;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function roundPrice(p: number) {
  return Math.round(p / 100) * 100;
}

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

function description(name: string, material: string, categoryLabel: string) {
  return `The ${name} is crafted from premium ${material.toLowerCase()}, reflecting Murgdur's commitment to understated luxury and meticulous construction. A versatile addition to the ${categoryLabel} collection, designed for those who value timeless craftsmanship and refined detail.`;
}

async function main() {
  const meili = new MeiliSearch({
    host: process.env.MEILISEARCH_HOST ?? 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
  });

  const existingProducts = await prisma.product.findMany({ select: { slug: true, sku: true } });
  const usedSlugs = new Set(existingProducts.map(p => p.slug));
  const usedSkus = new Set(existingProducts.map(p => p.sku));

  const syncDocs: any[] = [];

  for (const cat of CATEGORY_SEEDS) {
    const category = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!category) {
      console.error(`Category not found: ${cat.slug}, skipping.`);
      continue;
    }

    const imageUrls: string[] = imageResults[cat.imageGroup] || [];
    const imagesToUse = imageUrls.slice(0, 6);

    console.log(`\n=== ${cat.slug}: uploading ${imagesToUse.length} images ===`);
    const uploadedUrls: string[] = [];
    for (let i = 0; i < imagesToUse.length; i++) {
      try {
        const buf = await downloadBuffer(imagesToUse[i]);
        const url = await uploadImage(buf, `_shared/${cat.slug}`, i);
        uploadedUrls.push(url);
        console.log(`  uploaded image ${i + 1}/${imagesToUse.length}`);
      } catch (err: any) {
        console.error(`  failed to fetch/upload image ${i + 1}: ${err.message}`);
      }
    }

    if (uploadedUrls.length === 0) {
      console.error(`  no images available for ${cat.slug}, skipping category`);
      continue;
    }

    for (let i = 0; i < cat.products.length; i++) {
      const name = cat.products[i];

      let slug = slugify(name);
      let suffix = 1;
      while (usedSlugs.has(slug)) {
        suffix++;
        slug = `${slugify(name)}-${suffix}`;
      }
      usedSlugs.add(slug);

      let sku = `${cat.skuPrefix}-${String(i + 1).padStart(3, '0')}`;
      while (usedSkus.has(sku)) {
        sku = `${sku}X`;
      }
      usedSkus.add(sku);

      const material = pick(cat.materials, i);
      const price = roundPrice(randInt(cat.priceRange[0], cat.priceRange[1]));
      const hasComparePrice = i % 3 === 0;
      const comparePrice = hasComparePrice ? roundPrice(price * 1.15) : null;

      const product = await prisma.product.create({
        data: {
          name,
          slug,
          sku,
          description: description(name, material, cat.slug.replace(/-/g, ' ')),
          shortDesc: `${material} · Premium craftsmanship`,
          price,
          comparePrice,
          currency: 'INR',
          categoryId: category.id,
          material,
          isActive: true,
        },
      });

      // Images: cycle two images per product from the uploaded set
      const img1 = pick(uploadedUrls, i);
      const img2 = pick(uploadedUrls, i + 1);
      await prisma.productImage.createMany({
        data: [
          { productId: product.id, url: img1, sortOrder: 0 },
          { productId: product.id, url: img2, sortOrder: 1 },
        ],
      });

      // Variants: 2 colors x (sizes or single)
      const colorsForProduct = [pick(cat.colors, i), pick(cat.colors, i + 2)].filter((c, idx, arr) => arr.indexOf(c) === idx);
      const sizesForProduct = cat.sizeOptions ? [pick(cat.sizeOptions, i), pick(cat.sizeOptions, i + 1)].filter((s, idx, arr) => arr.indexOf(s) === idx) : [null];

      let variantIdx = 0;
      for (const color of colorsForProduct) {
        for (const size of sizesForProduct) {
          variantIdx++;
          const variantSku = `${sku}-V${variantIdx}`;
          await prisma.productVariant.create({
            data: {
              productId: product.id,
              sku: variantSku,
              color,
              colorHex: COLOR_HEX[color] ?? null,
              size,
              stock: randInt(3, 40),
              isActive: true,
            },
          });
        }
      }

      syncDocs.push({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        categoryId: product.categoryId,
        image: img1,
      });

      console.log(`  created ${sku} - ${name} (${colorsForProduct.length * sizesForProduct.length} variants)`);
    }
  }

  if (syncDocs.length > 0) {
    await meili.index('products').addDocuments(syncDocs, { primaryKey: 'id' });
    console.log(`\nSynced ${syncDocs.length} products to Meilisearch.`);
  }

  console.log('\nDone.');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
