import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // 插入初始角色数据
  const roles = [
    { id: 1, name: 'admin' },
    { id: 2, name: 'user' },
    { id: 3, name: 'superAdmin' },
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: {},
      create: role,
    });
  }

  console.log('Roles seeded: admin (id=1), user (id=2), superAdmin (id=3)');

  // 创建管理员用户
  const adminEmail = 'admin@example.com';
  const adminPassword = 'admin123';

  const existingAdmin = await prisma.member.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const admin = await prisma.member.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Admin',
        verifiedAt: new Date(),
      },
    });

    // 给管理员用户赋予 admin 角色
    await prisma.userRole.create({
      data: {
        userId: admin.id,
        roleId: 1,
      },
    });

    console.log('Created admin user:', { email: adminEmail, password: adminPassword });
  } else {
    // 确保现有管理员有 admin 角色
    await prisma.userRole.upsert({
      where: { userId: existingAdmin.id },
      update: { roleId: 1 },
      create: {
        userId: existingAdmin.id,
        roleId: 1,
      },
    });
    console.log('Admin user already exists, role updated');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });