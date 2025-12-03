const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');
}

main()
  .catch((err) => console.error(err))
  .finally(() => prisma.$disconnect());
