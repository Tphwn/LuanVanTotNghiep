/**
 * Seed tiện nghi mẫu theo danh mục admin
 * Chạy: node prisma/seedAmenities.js
 */
require('dotenv').config();
const prisma = require('../src/config/prisma');

/** @type {{ ten: string, loai: 'khach_san'|'phong'|'ca_hai', bieu_tuong: string }[]} */
const AMENITY_SEED = [
  // Tiện nghi phòng
  { ten: 'Áo choàng tắm', loai: 'phong', bieu_tuong: 'bed' },
  { ten: 'Truyền hình cáp', loai: 'phong', bieu_tuong: 'tv' },
  { ten: 'Bàn làm việc', loai: 'phong', bieu_tuong: 'desk' },
  { ten: 'Máy sấy tóc', loai: 'phong', bieu_tuong: 'hairdryer' },
  { ten: 'Két an toàn trong phòng', loai: 'phong', bieu_tuong: 'safe' },
  { ten: 'Phòng tắm vòi sen', loai: 'phong', bieu_tuong: 'bathtub' },

  // Các tiện ích lân cận
  { ten: 'Máy ATM/Ngân hàng', loai: 'khach_san', bieu_tuong: 'atm' },
  { ten: 'Cửa hàng', loai: 'khach_san', bieu_tuong: 'shop' },

  // Các hoạt động
  { ten: 'Khu vui chơi trẻ em', loai: 'khach_san', bieu_tuong: 'kids' },

  // Dịch vụ khách sạn
  { ten: 'Dịch vụ concierge/hỗ trợ khách', loai: 'khach_san', bieu_tuong: 'meeting' },
  { ten: 'Dịch vụ nhận phòng cấp tốc', loai: 'khach_san', bieu_tuong: 'key' },
  { ten: 'Dịch vụ trả phòng cấp tốc', loai: 'khach_san', bieu_tuong: 'key' },
  { ten: 'Quầy lễ tân', loai: 'khach_san', bieu_tuong: 'meeting' },
  { ten: 'Lễ tân 24h', loai: 'khach_san', bieu_tuong: 'security' },
  { ten: 'Bảo vệ 24 giờ', loai: 'khach_san', bieu_tuong: 'security' },
  { ten: 'Dịch vụ giặt ủi', loai: 'khach_san', bieu_tuong: 'laundry' },
  { ten: 'Dịch vụ lưu trữ/bảo quản hành lý', loai: 'khach_san', bieu_tuong: 'luggage' },

  // Vận chuyển
  { ten: 'Đưa đón sân bay', loai: 'khach_san', bieu_tuong: 'shuttle' },

  // Kết nối mạng (phòng)
  { ten: 'Wifi (miễn phí)', loai: 'phong', bieu_tuong: 'wifi' },

  // Tiện nghi công cộng
  { ten: 'Nhận phòng sớm', loai: 'khach_san', bieu_tuong: 'early_checkin' },
  { ten: 'Trả phòng muộn', loai: 'khach_san', bieu_tuong: 'late_checkout' },
  { ten: 'Nhà hàng phục vụ bữa sáng', loai: 'khach_san', bieu_tuong: 'breakfast' },
  { ten: 'WiFi tại khu vực chung', loai: 'khach_san', bieu_tuong: 'wifi' },

  // Ẩm thực
  { ten: 'Tiệm cà phê', loai: 'khach_san', bieu_tuong: 'coffee' },

  // Tiện nghi chung
  { ten: 'Khu vực hút thuốc', loai: 'ca_hai', bieu_tuong: 'smoke' },
];

const normalizeName = (name) => String(name).trim().toLowerCase();

async function upsertAmenity({ ten, loai, bieu_tuong }) {
  const existing = await prisma.tien_nghi.findFirst({
    where: { ten: { equals: ten } },
  });

  if (existing) {
    console.log(`  ✓ Đã có: ${ten}`);
    return existing;
  }

  const created = await prisma.tien_nghi.create({
    data: { ten, loai, bieu_tuong, trang_thai: 'hoat_dong' },
  });
  console.log(`  + Thêm: ${ten}`);
  return created;
}

async function main() {
  console.log('🌱 Seed tiện nghi...\n');

  const existing = await prisma.tien_nghi.findMany({ select: { ten: true } });
  const existingNames = new Set(existing.map((a) => normalizeName(a.ten)));

  let added = 0;
  let skipped = 0;

  for (const item of AMENITY_SEED) {
    if (existingNames.has(normalizeName(item.ten))) {
      console.log(`  ✓ Đã có: ${item.ten}`);
      skipped += 1;
      continue;
    }

    await upsertAmenity(item);
    existingNames.add(normalizeName(item.ten));
    added += 1;
  }

  const total = await prisma.tien_nghi.count();
  console.log(`\n✅ Hoàn tất: thêm ${added}, bỏ qua ${skipped}, tổng ${total} tiện nghi`);
}

main()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
