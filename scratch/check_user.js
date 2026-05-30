import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const row = await prisma.userData.findUnique({
    where: { id: 'user_y2rvtzyad88' }
  });
  console.log("Row user_y2rvtzyad88:", row);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
