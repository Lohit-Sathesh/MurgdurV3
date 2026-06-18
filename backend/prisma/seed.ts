import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Murgdur database...')

  // ── CATEGORIES ───────────────────────────────────────────

  const men = await prisma.category.upsert({
    where: { slug: 'men' },
    update: {},
    create: { name: 'Men', slug: 'men', sortOrder: 1 }
  })

  const women = await prisma.category.upsert({
    where: { slug: 'women' },
    update: {},
    create: { name: 'Women', slug: 'women', sortOrder: 2 }
  })

  const bags = await prisma.category.upsert({
    where: { slug: 'bags' },
    update: {},
    create: { name: 'Bags', slug: 'bags', sortOrder: 3 }
  })

  const watches = await prisma.category.upsert({
    where: { slug: 'watches' },
    update: {},
    create: { name: 'Watches', slug: 'watches', sortOrder: 4 }
  })

  const collections = await prisma.category.upsert({
    where: { slug: 'collections' },
    update: {},
    create: { name: 'Collections', slug: 'collections', sortOrder: 5 }
  })

  await prisma.category.upsert({
    where: { slug: 'new-arrivals' },
    update: {},
    create: { name: 'New Arrivals', slug: 'new-arrivals', sortOrder: 0 }
  })

  // Men subcategories
  await prisma.category.upsert({
    where: { slug: 'mens-ready-to-wear' },
    update: {},
    create: { name: 'Ready to Wear', slug: 'mens-ready-to-wear', parentId: men.id, sortOrder: 1 }
  })
  await prisma.category.upsert({
    where: { slug: 'mens-accessories' },
    update: {},
    create: { name: 'Accessories', slug: 'mens-accessories', parentId: men.id, sortOrder: 2 }
  })
  await prisma.category.upsert({
    where: { slug: 'mens-shoes' },
    update: {},
    create: { name: 'Shoes', slug: 'mens-shoes', parentId: men.id, sortOrder: 3 }
  })

  // Women subcategories
  await prisma.category.upsert({
    where: { slug: 'womens-ready-to-wear' },
    update: {},
    create: { name: 'Ready to Wear', slug: 'womens-ready-to-wear', parentId: women.id, sortOrder: 1 }
  })
  await prisma.category.upsert({
    where: { slug: 'womens-accessories' },
    update: {},
    create: { name: 'Accessories', slug: 'womens-accessories', parentId: women.id, sortOrder: 2 }
  })
  await prisma.category.upsert({
    where: { slug: 'womens-shoes' },
    update: {},
    create: { name: 'Shoes', slug: 'womens-shoes', parentId: women.id, sortOrder: 3 }
  })

  // Bags subcategories
  await prisma.category.upsert({
    where: { slug: 'handbags' },
    update: {},
    create: { name: 'Handbags', slug: 'handbags', parentId: bags.id, sortOrder: 1 }
  })
  await prisma.category.upsert({
    where: { slug: 'travel-bags' },
    update: {},
    create: { name: 'Travel', slug: 'travel-bags', parentId: bags.id, sortOrder: 2 }
  })
  await prisma.category.upsert({
    where: { slug: 'small-leather-goods' },
    update: {},
    create: { name: 'Small Leather Goods', slug: 'small-leather-goods', parentId: bags.id, sortOrder: 3 }
  })

  // Collections subcategories
  await prisma.category.upsert({
    where: { slug: 'summer-2025' },
    update: {},
    create: { name: 'Summer 2025', slug: 'summer-2025', parentId: collections.id, sortOrder: 1 }
  })
  await prisma.category.upsert({
    where: { slug: 'noir-series' },
    update: {},
    create: { name: 'Noir Series', slug: 'noir-series', parentId: collections.id, sortOrder: 2 }
  })
  await prisma.category.upsert({
    where: { slug: 'limited-edition' },
    update: {},
    create: { name: 'Limited Edition', slug: 'limited-edition', parentId: collections.id, sortOrder: 3 }
  })

  console.log('✅ Categories seeded')

  // ── ADMIN USER ────────────────────────────────────────────

  const adminPassword = await bcrypt.hash('Admin@123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@murgdur.com' },
    update: {},
    create: {
      email: 'admin@murgdur.com',
      passwordHash: adminPassword,
      firstName: 'Murgdur',
      lastName: 'Admin',
      customerId: 'MRG-00000001',
      role: 'ADMIN',
      emailVerified: true,
    }
  })

  console.log('✅ Admin user seeded — admin@murgdur.com / Admin@123')

  // ── SAMPLE PRODUCTS ───────────────────────────────────────

  const handbagsCat = await prisma.category.findUnique({ where: { slug: 'handbags' } })
  const womenRTW    = await prisma.category.findUnique({ where: { slug: 'womens-ready-to-wear' } })
  const menRTW      = await prisma.category.findUnique({ where: { slug: 'mens-ready-to-wear' } })

  // Product 1 — Handbag
  const tote = await prisma.product.upsert({
    where: { slug: 'noir-leather-tote' },
    update: {},
    create: {
      name: 'Noir Leather Tote',
      slug: 'noir-leather-tote',
      sku: 'MRG-BAG-001',
      description: 'A masterpiece of understated luxury. Hand-stitched in full-grain calfskin with gold-tone hardware.',
      shortDesc: 'Full-grain calfskin tote with gold-tone hardware.',
      price: 185000,
      categoryId: handbagsCat!.id,
      material: 'Full-grain calfskin leather',
      isFeatured: true,
      isActive: true,
    }
  })

  await prisma.productVariant.upsert({
    where: { sku: 'MRG-BAG-001-BLK' },
    update: {},
    create: { productId: tote.id, sku: 'MRG-BAG-001-BLK', color: 'Black', colorHex: '#0a0a0a', stock: 12 }
  })

  await prisma.productVariant.upsert({
    where: { sku: 'MRG-BAG-001-CML' },
    update: {},
    create: { productId: tote.id, sku: 'MRG-BAG-001-CML', color: 'Camel', colorHex: '#c19a6b', stock: 7 }
  })

  // Product 2 — Women's dress
  const dress = await prisma.product.upsert({
    where: { slug: 'silk-noir-evening-dress' },
    update: {},
    create: {
      name: 'Silk Noir Evening Dress',
      slug: 'silk-noir-evening-dress',
      sku: 'MRG-WOM-001',
      description: 'Draped in the finest Mulberry silk. A silhouette that commands attention and whispers elegance.',
      shortDesc: 'Mulberry silk evening dress with draped silhouette.',
      price: 95000,
      categoryId: womenRTW!.id,
      material: 'Mulberry silk',
      isFeatured: true,
      isActive: true,
    }
  })

  for (const [size, stock] of [['XS', 3], ['S', 8], ['M', 10], ['L', 6], ['XL', 2]]) {
    await prisma.productVariant.upsert({
      where: { sku: `MRG-WOM-001-${size}` },
      update: {},
      create: { productId: dress.id, sku: `MRG-WOM-001-${size}`, size: String(size), color: 'Black', colorHex: '#0a0a0a', stock: Number(stock) }
    })
  }

  // Product 3 — Men's suit
  const suit = await prisma.product.upsert({
    where: { slug: 'charcoal-wool-suit' },
    update: {},
    create: {
      name: 'Charcoal Wool Suit',
      slug: 'charcoal-wool-suit',
      sku: 'MRG-MEN-001',
      description: 'Tailored from 130s Super Wool. Clean lines, impeccable construction, timeless authority.',
      shortDesc: '130s Super Wool tailored suit.',
      price: 145000,
      categoryId: menRTW!.id,
      material: '130s Super Wool',
      isFeatured: true,
      isActive: true,
    }
  })

  for (const [size, stock] of [['46', 4], ['48', 9], ['50', 11], ['52', 7], ['54', 3]]) {
    await prisma.productVariant.upsert({
      where: { sku: `MRG-MEN-001-${size}` },
      update: {},
      create: { productId: suit.id, sku: `MRG-MEN-001-${size}`, size: String(size), color: 'Charcoal', colorHex: '#36454f', stock: Number(stock) }
    })
  }

  // Product 4 — Out of stock example
  const clutch = await prisma.product.upsert({
    where: { slug: 'gold-chain-clutch' },
    update: {},
    create: {
      name: 'Gold Chain Clutch',
      slug: 'gold-chain-clutch',
      sku: 'MRG-BAG-002',
      description: 'A statement clutch in hand-painted suede with a 24k gold-plated chain.',
      shortDesc: 'Hand-painted suede clutch with gold-plated chain.',
      price: 68000,
      categoryId: handbagsCat!.id,
      material: 'Suede leather',
      isFeatured: false,
      isActive: true,
    }
  })

  await prisma.productVariant.upsert({
    where: { sku: 'MRG-BAG-002-GLD' },
    update: {},
    create: { productId: clutch.id, sku: 'MRG-BAG-002-GLD', color: 'Gold', colorHex: '#c9a96e', stock: 0 }
  })

  // Product 5 — Low stock example
  const coat = await prisma.product.upsert({
    where: { slug: 'cashmere-overcoat' },
    update: {},
    create: {
      name: 'Cashmere Overcoat',
      slug: 'cashmere-overcoat',
      sku: 'MRG-MEN-002',
      description: 'Double-faced cashmere in a structured silhouette. The coat that defines a wardrobe.',
      shortDesc: 'Double-faced cashmere structured overcoat.',
      price: 210000,
      categoryId: menRTW!.id,
      material: 'Double-faced cashmere',
      isFeatured: true,
      isActive: true,
    }
  })

  for (const [size, stock] of [['M', 2], ['L', 3], ['XL', 1]]) {
    await prisma.productVariant.upsert({
      where: { sku: `MRG-MEN-002-${size}` },
      update: {},
      create: { productId: coat.id, sku: `MRG-MEN-002-${size}`, size: String(size), color: 'Camel', colorHex: '#c19a6b', stock: Number(stock) }
    })
  }

  console.log('✅ Sample products seeded')
  console.log('')
  console.log('🎉 Database seeded successfully')
  console.log('')
  console.log('Admin login:')
  console.log('  Email:    admin@murgdur.com')
  console.log('  Password: Admin@123')
  console.log('')
  console.log('Sample products:')
  console.log('  /products/noir-leather-tote')
  console.log('  /products/silk-noir-evening-dress')
  console.log('  /products/charcoal-wool-suit')
  console.log('  /products/gold-chain-clutch      ← out of stock')
  console.log('  /products/cashmere-overcoat       ← low stock')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })