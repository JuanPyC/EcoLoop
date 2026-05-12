import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`SELECT typname FROM pg_type WHERE typname = 'UserRole' OR typname = 'user_role'`;
    console.log('Types in DB:', result);
    
    // Test creating a profile with raw SQL
    // await prisma.$executeRaw`INSERT INTO profiles (email, password_hash, role) VALUES ('test_raw@test.com', 'hash', 'user')`;
    // console.log('Raw insert successful');
  } catch (err) {
    console.error('Error in scratch script:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
