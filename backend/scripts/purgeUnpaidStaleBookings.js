const prisma = require('../src/config/prisma');
const {
  expireUnpaidOnlineHolds,
  purgeCancelledUnpaidBookings,
} = require('../src/utils/unpaidBookingCleanup');

(async () => {
  const expired = await expireUnpaidOnlineHolds(prisma);
  const cancelled = await purgeCancelledUnpaidBookings(prisma);
  console.log(`Đã xóa ${expired} đơn hết hạn + ${cancelled} đơn hủy chưa thanh toán`);
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
