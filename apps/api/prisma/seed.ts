/**
 * Seed demo data for local development: roles, a few categories, fabrics,
 * and products with variants & images. Idempotent-ish (uses upserts on slugs).
 * Run: npm run db:seed -w apps/api
 */
import { PrismaClient, RoleKey } from '@prisma/client';

const prisma = new PrismaClient();

const ROLES: { key: RoleKey; label: string }[] = [
  { key: 'guest', label: 'Guest' },
  { key: 'customer', label: 'Customer' },
  { key: 'support', label: 'Customer Support' },
  { key: 'tailor', label: 'Tailor' },
  { key: 'measurement_reviewer', label: 'Measurement Reviewer' },
  { key: 'workshop_operator', label: 'Workshop Operator' },
  { key: 'qc_officer', label: 'Quality Control Officer' },
  { key: 'production_manager', label: 'Production Manager' },
  { key: 'catalog_manager', label: 'Catalog Manager' },
  { key: 'finance', label: 'Finance' },
  { key: 'admin', label: 'Administrator' },
  { key: 'super_admin', label: 'Super Administrator' },
];

async function main(): Promise<void> {
  // Roles
  for (const r of ROLES) {
    await prisma.role.upsert({ where: { key: r.key }, update: {}, create: r });
  }

  // Categories
  const categories = [
    { name: 'Kurta / Qameez', slug: 'kurta-qameez', sortOrder: 1 },
    { name: 'Shalwar / Trouser', slug: 'shalwar-trouser', sortOrder: 2 },
    { name: 'Abaya', slug: 'abaya', sortOrder: 3 },
    { name: 'Formal Shirt', slug: 'formal-shirt', sortOrder: 4 },
  ];
  for (const c of categories) {
    await prisma.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  }
  const kurta = await prisma.category.findUniqueOrThrow({ where: { slug: 'kurta-qameez' } });
  const shirt = await prisma.category.findUniqueOrThrow({ where: { slug: 'formal-shirt' } });

  // Fabrics
  const fabrics = [
    { name: 'Cotton', stretch: 'non_stretch' as const, weightGsm: 140, pricePerUnit: 0, colorHex: '#EDE7D9' },
    { name: 'Linen', stretch: 'non_stretch' as const, weightGsm: 170, pricePerUnit: 600, colorHex: '#D9C7A3' },
    { name: 'Wash & Wear', stretch: 'stretch' as const, weightGsm: 120, pricePerUnit: 300, colorHex: '#C9D3E0' },
  ];
  const fabricRecords = [];
  for (const f of fabrics) {
    const existing = await prisma.fabric.findFirst({ where: { name: f.name } });
    fabricRecords.push(
      existing
        ? await prisma.fabric.update({ where: { id: existing.id }, data: f })
        : await prisma.fabric.create({ data: f }),
    );
  }

  // Products
  const products = [
    {
      categoryId: kurta.id,
      title: 'Classic Cotton Kurta',
      slug: 'classic-cotton-kurta',
      description: 'A timeless straight-cut kurta. Ready-size or made-to-measure.',
      basePrice: 4500,
      image: 'https://placehold.co/800x1000/EDE7D9/2B3A67?text=Kurta',
    },
    {
      categoryId: shirt.id,
      title: 'Tailored Formal Shirt',
      slug: 'tailored-formal-shirt',
      description: 'Crisp formal shirt with a clean collar. Slim, regular or relaxed.',
      basePrice: 3200,
      image: 'https://placehold.co/800x1000/C9D3E0/2B3A67?text=Shirt',
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        basePrice: p.basePrice,
        categoryId: p.categoryId,
      },
      create: {
        categoryId: p.categoryId,
        title: p.title,
        slug: p.slug,
        description: p.description,
        basePrice: p.basePrice,
      },
    });

    // Image (reset to one)
    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    await prisma.productImage.create({
      data: { productId: product.id, url: p.image, alt: p.title, sortOrder: 0 },
    });

    // Ready sizes
    const sizes = ['S', 'M', 'L', 'XL'];
    for (const size of sizes) {
      const sku = `${p.slug}-${size}`.toUpperCase();
      await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: { productId: product.id, sku, sizeLabel: size, priceDelta: 0 },
      });
    }

    // Link fabrics
    for (const fabric of fabricRecords) {
      await prisma.productFabric.upsert({
        where: { productId_fabricId: { productId: product.id, fabricId: fabric.id } },
        update: {},
        create: { productId: product.id, fabricId: fabric.id },
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log('Seed complete: roles, categories, fabrics, products.');
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
