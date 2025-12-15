const { PrismaClient } = require('./packages/database/node_modules/@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'luk.gber@gmail.com' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        deletedAt: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    console.log('\n📊 User Status:');
    console.log(JSON.stringify(user, null, 2));

    if (user) {
      console.log('\n✅ User exists');
      console.log(`   Deleted: ${user.deletedAt ? 'YES' : 'NO'}`);
      console.log(`   Last Login: ${user.lastLoginAt || 'Never'}`);
    } else {
      console.log('\n❌ User not found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
