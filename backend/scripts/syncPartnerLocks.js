require('dotenv').config();
const prisma = require('../src/config/prisma');
const { syncAllLockedPartners } = require('../src/utils/partnerLockHelpers');

syncAllLockedPartners(prisma)
  .then((count) => {
    console.log(`Synced ${count} locked partner(s)`);
    return prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    return prisma.$disconnect().finally(() => process.exit(1));
  });
