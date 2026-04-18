import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COLLEGE = 'Army Institute of Technology';

async function main() {
  console.log(`\nUpdating all ADMIN users to college: ${COLLEGE}\n`);
  
  const result = await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { collegeName: COLLEGE }
  });

  console.log(`✅ Success. Updated ${result.count} admin accounts.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
