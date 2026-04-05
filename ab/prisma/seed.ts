import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 插入初始角色数据
  await prisma.role.createMany({
    data: [
      { id: 1, name: 'admin' },
      { id: 2, name: 'user' },
    ],
    skipDuplicates: true, // 如果已存在则跳过
  });

  console.log('Roles seeded: admin (id=1), user (id=2)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });