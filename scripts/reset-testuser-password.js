/**
 * Script to reset the testuser password
 * Run with: node scripts/reset-testuser-password.js
 */
import bcrypt from 'bcryptjs';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL || 'file:./dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const password = 'testpassword123';
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { username: 'testuser' },
    data: { passwordHash },
  });

  console.log('Password reset successfully for user:', user.username);
  console.log('New password: testpassword123');

  // Also clear any existing sessions
  await prisma.session.deleteMany({
    where: { userId: user.id },
  });
  console.log('Cleared all sessions for user');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
