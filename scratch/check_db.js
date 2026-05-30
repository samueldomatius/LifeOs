import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config(); // Just loads .env from the directory it is run (which will be root)

const prisma = new PrismaClient();

async function main() {
  console.log("DATABASE_URL in env:", process.env.DATABASE_URL);
  const allData = await prisma.userData.findMany();
  console.log(`Found ${allData.length} records:`);
  for (const row of allData) {
    console.log("-----------------------------------------");
    console.log(`ID: ${row.id}`);
    console.log(`Email: ${row.email}`);
    console.log(`Updated At: ${row.updatedAt}`);
    console.log(`Tasks: ${JSON.stringify(row.tasks).substring(0, 100)}`);
    console.log(`Finances: ${JSON.stringify(row.finances).substring(0, 100)}`);
    console.log(`History: ${JSON.stringify(row.history).substring(0, 100)}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
