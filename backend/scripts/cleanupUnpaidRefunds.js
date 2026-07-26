
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const rows = await prisma.hoan_tien.findMany({
    select: {
      ma_hoan_tien: true,
      ma_dat_phong: true,
      so_tien_hoan: true,
      trang_thai: true,
      thanh_toan: { select: { trang_thai: true } },
    },
  });

  const badRefunds = rows.filter((r) => r.thanh_toan?.trang_thai !== 'thanh_cong');
  console.log(`Tìm thấy ${badRefunds.length} hoàn tiền không hợp lệ.`);
  if (!badRefunds.length) return;

  const ids = badRefunds.map((r) => r.ma_hoan_tien);
  const result = await prisma.hoan_tien.deleteMany({
    where: { ma_hoan_tien: { in: ids } },
  });
  console.log(`Đã xóa ${result.count} bản ghi:`, badRefunds.map((r) => ({
    ma_hoan_tien: r.ma_hoan_tien,
    ma_dat_phong: r.ma_dat_phong,
    tt: r.thanh_toan?.trang_thai || null,
  })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
