import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const resetTokens = await prisma.passwordResetToken.findMany({
    orderBy: { createdAt: 'desc' },
    take: 3
  });
  console.log('Reset Tokens:', JSON.stringify(resetTokens, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
