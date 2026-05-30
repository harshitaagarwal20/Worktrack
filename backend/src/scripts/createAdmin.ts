import bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';
import { nextEmployeeIdFromLast } from '../utils/orderId';

const prisma = new PrismaClient();

async function main() {
  const email = 'office@aomittal.com';
  const password = 'AOM@2008';
  const firstName = 'Arpit';
  const lastName = 'Mittal';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('User already exists:', existing.email, '| role:', existing.role);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const rows: Array<{ employeeCode: string }> = await prisma.$queryRaw`
    SELECT employeeCode FROM employees
    ORDER BY CAST(SUBSTRING(employeeCode, 5) AS UNSIGNED) DESC LIMIT 1
  `;
  const lastCode = rows.length ? rows[0].employeeCode : undefined;
  const employeeCode = nextEmployeeIdFromLast(lastCode);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, password: hashedPassword, role: Role.HR_ADMIN },
    });

    const employee = await tx.employee.create({
      data: {
        userId: user.id,
        employeeCode,
        firstName,
        lastName,
        designation: 'HR Admin',
        monthlySalary: 0,
        dateOfJoining: new Date(),
      },
    });

    return { user, employee };
  });

  console.log('Admin user created successfully!');
  console.log('Email   :', result.user.email);
  console.log('Role    :', result.user.role);
  console.log('EmpCode :', result.employee.employeeCode);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
