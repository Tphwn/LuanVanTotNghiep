/**
 * Đưa các thanh toán bị đánh "that_bai" nhầm (chưa từng thanh toán thành công)
 * về "cho" — vì that_bai chỉ dành cho giao dịch đã thử thanh toán nhưng thất bại.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.thanh_toan.updateMany({
    where: { trang_thai: 'that_bai' },
    data: { trang_thai: 'cho' },
  });
  console.log(`Đã chuyển ${result.count} giao dịch that_bai → cho`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
