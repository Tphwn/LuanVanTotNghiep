const prisma = require('../src/config/prisma');

async function main() {
  const expired = await prisma.$executeRaw`
    UPDATE khuyen_mai
    SET trang_thai = 'het_han', ly_do = NULL
    WHERE loai_nguon = 'doi_tac'
      AND trang_thai = 'cho_duyet'
      AND ngay_ket_thuc < CURDATE()
  `;
  const active = await prisma.$executeRaw`
    UPDATE khuyen_mai
    SET trang_thai = 'hoat_dong', ly_do = NULL
    WHERE loai_nguon = 'doi_tac'
      AND trang_thai = 'cho_duyet'
      AND ngay_ket_thuc >= CURDATE()
  `;
  console.log(`Đã cập nhật: hết hạn=${expired}, hoạt động=${active}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
