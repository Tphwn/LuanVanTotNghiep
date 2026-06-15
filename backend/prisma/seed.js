/**
 * Seed dữ liệu mẫu: khách sạn, loại phòng, tiện nghi, ảnh
 * Chạy: npm run seed
 */
require('dotenv').config();
const prisma = require('../src/config/prisma');

const PARTNER_ID = 4;
const ADMIN_ID = 1;
const AMENITY_IDS = [1, 2, 3, 4, 6];

const HOTEL_IMAGES = [
  '/uploads/1781517997293-790032295.jpg',
  '/uploads/1781452828816-761136886.jpg',
  '/uploads/1781429587142-867533449.jpg',
];

const ROOM_IMAGES = [
  '/uploads/room-1781518022276-455911627.jpg',
  '/uploads/room-1781518022277-724837664.jpg',
  '/uploads/room-1781456087094-38928142.jpg',
  '/uploads/room-1781456436890-667420503.jpg',
  '/uploads/room-1781459674824-340625050.jpg',
  '/uploads/room-1781459819245-18960879.jpg',
];

const timeOf = (h, m = 0) => new Date(`1970-01-01T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`);

const attachAmenities = async (hotelId, amenityIds = AMENITY_IDS) => {
  for (const ma_tien_nghi of amenityIds) {
    const exists = await prisma.khach_san_tien_nghi.findFirst({
      where: { ma_khach_san: hotelId, ma_tien_nghi },
    });
    if (!exists) {
      await prisma.khach_san_tien_nghi.create({ data: { ma_khach_san: hotelId, ma_tien_nghi } });
    }
  }
};

const attachHotelImages = async (hotelId, urls = HOTEL_IMAGES) => {
  const existing = await prisma.hinh_anh.count({
    where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotelId },
  });
  if (existing > 0) return;

  for (let i = 0; i < urls.length; i++) {
    await prisma.hinh_anh.create({
      data: {
        loai_doi_tuong: 'khach_san',
        ma_doi_tuong: hotelId,
        url: urls[i % urls.length],
        la_anh_chinh: i === 0,
        thu_tu: i,
      },
    });
  }
};

const createRoomType = async (hotelId, room, imgIndex = 0) => {
  const existing = await prisma.loai_phong.findFirst({
    where: { ma_khach_san: hotelId, ten_loai: room.ten_loai },
  });
  if (existing) {
    await prisma.loai_phong.update({
      where: { ma_loai_phong: existing.ma_loai_phong },
      data: {
        suc_chua: room.suc_chua,
        gia_co_ban: room.gia_co_ban,
        so_luong_phong: room.so_luong_phong,
        so_luong_mo_ban: room.so_luong_mo_ban,
        trang_thai: 'hoat_dong',
        mo_ta: room.mo_ta,
        dien_tich: room.dien_tich,
        so_giuong: room.so_giuong ?? 1,
      },
    });
    return existing.ma_loai_phong;
  }

  const created = await prisma.loai_phong.create({
    data: {
      ma_khach_san: hotelId,
      ten_loai: room.ten_loai,
      dien_tich: room.dien_tich,
      suc_chua: room.suc_chua,
      so_luong_phong: room.so_luong_phong,
      so_luong_mo_ban: room.so_luong_mo_ban,
      gia_co_ban: room.gia_co_ban,
      mo_ta: room.mo_ta,
      so_giuong: room.so_giuong ?? 1,
      trang_thai: 'hoat_dong',
    },
  });

  const imgCount = await prisma.hinh_anh.count({
    where: { loai_doi_tuong: 'loai_phong', ma_doi_tuong: created.ma_loai_phong },
  });
  if (imgCount === 0) {
    await prisma.hinh_anh.createMany({
      data: [
        {
          loai_doi_tuong: 'loai_phong',
          ma_doi_tuong: created.ma_loai_phong,
          url: ROOM_IMAGES[imgIndex % ROOM_IMAGES.length],
          la_anh_chinh: true,
          thu_tu: 0,
        },
        {
          loai_doi_tuong: 'loai_phong',
          ma_doi_tuong: created.ma_loai_phong,
          url: ROOM_IMAGES[(imgIndex + 1) % ROOM_IMAGES.length],
          la_anh_chinh: false,
          thu_tu: 1,
        },
      ],
    });
  }

  return created.ma_loai_phong;
};

const createHotel = async (data, rooms) => {
  let hotel = await prisma.khach_san.findFirst({
    where: { ten: data.ten, ma_doi_tac: PARTNER_ID },
  });

  if (!hotel) {
    hotel = await prisma.khach_san.create({
      data: {
        ...data,
        ma_doi_tac: PARTNER_ID,
        trang_thai: 'hoat_dong',
        duyet_boi_admin_id: ADMIN_ID,
        ngay_duyet: new Date(),
        gio_nhan_phong: data.gio_nhan_phong ?? timeOf(14),
        gio_tra_phong: data.gio_tra_phong ?? timeOf(12),
      },
    });
    console.log(`  + Tạo KS: ${hotel.ten}`);
  } else {
    await prisma.khach_san.update({
      where: { ma_khach_san: hotel.ma_khach_san },
      data: { trang_thai: 'hoat_dong' },
    });
    console.log(`  ✓ Đã có KS: ${hotel.ten}`);
  }

  await attachAmenities(hotel.ma_khach_san);
  await attachHotelImages(hotel.ma_khach_san);

  for (let i = 0; i < rooms.length; i++) {
    await createRoomType(hotel.ma_khach_san, rooms[i], i);
  }

  return hotel;
};

async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu khách sạn...\n');

  // ── Bổ sung loại phòng cho KS hiện có ──
  console.log('📌 Bổ sung loại phòng cho khách sạn hiện có');

  await prisma.khach_san.update({
    where: { ma_khach_san: 2 },
    data: { trang_thai: 'hoat_dong' },
  });
  await attachHotelImages(2, [HOTEL_IMAGES[1], HOTEL_IMAGES[2]]);

  await createRoomType(2, {
    ten_loai: 'Deluxe Double',
    dien_tich: 28,
    suc_chua: 2,
    so_luong_phong: 12,
    so_luong_mo_ban: 10,
    gia_co_ban: 850000,
    mo_ta: 'Phòng đôi view thung lũng, ban công riêng',
    so_giuong: 1,
  }, 0);

  await createRoomType(2, {
    ten_loai: 'Family Suite',
    dien_tich: 45,
    suc_chua: 4,
    so_luong_phong: 6,
    so_luong_mo_ban: 5,
    gia_co_ban: 1450000,
    mo_ta: 'Suite gia đình 2 phòng ngủ, view rừng thông',
    so_giuong: 2,
  }, 2);

  await createRoomType(2, {
    ten_loai: 'Superior Twin',
    dien_tich: 26,
    suc_chua: 2,
    so_luong_phong: 8,
    so_luong_mo_ban: 7,
    gia_co_ban: 720000,
    mo_ta: '2 giường đơn, gần trung tâm Đà Lạt',
    so_giuong: 2,
  }, 4);

  await createRoomType(3, {
    ten_loai: 'Ocean View Deluxe',
    dien_tich: 32,
    suc_chua: 2,
    so_luong_phong: 10,
    so_luong_mo_ban: 8,
    gia_co_ban: 980000,
    mo_ta: 'View biển trực diện, ban công rộng',
    so_giuong: 1,
  }, 1);

  await createRoomType(3, {
    ten_loai: 'Executive Suite',
    dien_tich: 55,
    suc_chua: 3,
    so_luong_phong: 4,
    so_luong_mo_ban: 4,
    gia_co_ban: 1850000,
    mo_ta: 'Suite cao cấp, phòng khách riêng',
    so_giuong: 1,
  }, 3);

  // Cập nhật phòng Lexus hiện có — tăng số lượng mở bán
  await prisma.loai_phong.updateMany({
    where: { ma_khach_san: 3, ten_loai: 'Lexus' },
    data: { so_luong_mo_ban: 4, trang_thai: 'hoat_dong' },
  });

  // ── Tạo khách sạn mới ──
  console.log('\n🏨 Tạo khách sạn mới');

  await createHotel(
    {
      ten: 'Seaside Resort Vũng Tàu',
      ma_dia_diem: 1,
      dia_chi: '12 Trần Phú, Phường 1, TP. Vũng Tàu, Bà Rịa - Vũng Tàu',
      mo_ta: 'Resort cao cấp sát biển với hồ bơi vô cực, spa và nhà hàng hải sản. Lý tưởng cho kỳ nghỉ cuối tuần.',
      so_sao: 5,
    },
    [
      { ten_loai: 'Standard Sea View', dien_tich: 30, suc_chua: 2, so_luong_phong: 20, so_luong_mo_ban: 15, gia_co_ban: 1200000, mo_ta: 'View biển, giường đôi king size' },
      { ten_loai: 'Deluxe Pool Access', dien_tich: 38, suc_chua: 2, so_luong_phong: 12, so_luong_mo_ban: 10, gia_co_ban: 1680000, mo_ta: 'Ra hồ bơi trực tiếp từ phòng' },
      { ten_loai: 'Family Bungalow', dien_tich: 52, suc_chua: 4, so_luong_phong: 8, so_luong_mo_ban: 6, gia_co_ban: 2200000, mo_ta: 'Bungalow riêng biệt cho gia đình 4 người', so_giuong: 2 },
    ]
  );

  await createHotel(
    {
      ten: 'Dalat Palace Heritage',
      ma_dia_diem: 3,
      dia_chi: '12 Trần Hưng Đạo, Phường 3, TP. Đà Lạt, Lâm Đồng',
      mo_ta: 'Khách sạn boutique phong cách Pháp giữa lòng thành phố ngàn hoa. Không gian ấm cúng, view hồ Xuân Hương.',
      so_sao: 4,
    },
    [
      { ten_loai: 'Classic Double', dien_tich: 24, suc_chua: 2, so_luong_phong: 15, so_luong_mo_ban: 12, gia_co_ban: 780000, mo_ta: 'Phòng cổ điển, lò sưởi decor' },
      { ten_loai: 'Garden View Twin', dien_tich: 26, suc_chua: 2, so_luong_phong: 10, so_luong_mo_ban: 9, gia_co_ban: 690000, mo_ta: 'View vườn hoa, 2 giường đơn', so_giuong: 2 },
      { ten_loai: 'Honeymoon Suite', dien_tich: 42, suc_chua: 2, so_luong_phong: 4, so_luong_mo_ban: 4, gia_co_ban: 1590000, mo_ta: 'Suite cao cấp với bồn tắm jacuzzi' },
    ]
  );

  await createHotel(
    {
      ten: 'Sunrise Beach Quy Nhơn',
      ma_dia_diem: 2,
      dia_chi: '28 Nguyễn Tất Thành, TP. Quy Nhơn, Bình Định',
      mo_ta: 'Khách sạn 4 sao bên bờ biển Quy Nhơn, gần Eo Gió và Kỳ Co. Phù hợp du lịch biển và khám phá.',
      so_sao: 4,
    },
    [
      { ten_loai: 'Superior City View', dien_tich: 28, suc_chua: 2, so_luong_phong: 18, so_luong_mo_ban: 14, gia_co_ban: 650000, mo_ta: 'View thành phố, tiện nghi đầy đủ' },
      { ten_loai: 'Beachfront Deluxe', dien_tich: 34, suc_chua: 2, so_luong_phong: 10, so_luong_mo_ban: 8, gia_co_ban: 890000, mo_ta: 'Sát biển, ban công nhìn bình minh' },
      { ten_loai: 'Triple Room', dien_tich: 32, suc_chua: 3, so_luong_phong: 8, so_luong_mo_ban: 7, gia_co_ban: 950000, mo_ta: 'Phòng 3 giường cho nhóm bạn', so_giuong: 3 },
    ]
  );

  // Thống kê sau seed
  const [hotelCount, roomCount, activeHotels] = await Promise.all([
    prisma.khach_san.count({ where: { trang_thai: 'hoat_dong' } }),
    prisma.loai_phong.count({ where: { trang_thai: 'hoat_dong' } }),
    prisma.khach_san.findMany({
      where: { trang_thai: 'hoat_dong' },
      select: { ten: true, dia_diem: { select: { ten_dia_diem: true } }, _count: { select: { loai_phong: true } } },
    }),
  ]);

  console.log('\n✅ Seed hoàn tất!');
  console.log(`   Khách sạn hoạt động: ${hotelCount}`);
  console.log(`   Loại phòng hoạt động: ${roomCount}`);
  console.log('\n   Danh sách:');
  activeHotels.forEach((h) => {
    console.log(`   • ${h.ten} (${h.dia_diem.ten_dia_diem}) — ${h._count.loai_phong} loại phòng`);
  });
}

main()
  .catch((err) => {
    console.error('❌ Seed thất bại:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
