const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const START = new Date('2026-07-25');
const END = new Date('2026-09-01');

/** @type {Array<{ ma_khach_san: number, tao_boi_id: number, loai_giam: 'phan_tram'|'so_tien', items: Array<{ code: string, ten: string, gia_tri: number }> }>} */
const HOTEL_PROMOS = [
  {
    ma_khach_san: 2,
    tao_boi_id: 2,
    loai_giam: 'so_tien',
    items: [
      { code: 'RIVER80K', ten: 'Chào hè River', gia_tri: 80000 },
      { code: 'RIVER120K', ten: 'Flash deal cuối tuần', gia_tri: 120000 },
      { code: 'RIVER150K', ten: 'Ưu đãi đặt sớm', gia_tri: 150000 },
      { code: 'RIVER200K', ten: 'Combo nghỉ dưỡng River', gia_tri: 200000 },
    ],
  },
  {
    ma_khach_san: 3,
    tao_boi_id: 2,
    loai_giam: 'so_tien',
    items: [
      { code: 'CANARY30K', ten: 'Canary Gold chào hè', gia_tri: 30000 },
      { code: 'CANARY50K', ten: 'Ưu đãi vàng cuối tuần', gia_tri: 50000 },
      { code: 'CANARY70K', ten: 'Deal tiết kiệm Canary', gia_tri: 70000 },
      { code: 'CANARY100K', ten: 'Flash sale Canary Gold', gia_tri: 100000 },
    ],
  },
  {
    ma_khach_san: 4,
    tao_boi_id: 2,
    loai_giam: 'so_tien',
    items: [
      { code: 'SEASIDE100K', ten: 'Biển xanh Vũng Tàu', gia_tri: 100000 },
      { code: 'SEASIDE150K', ten: 'Seaside cuối tuần', gia_tri: 150000 },
      { code: 'SEASIDE200K', ten: 'Ưu đãi view biển', gia_tri: 200000 },
      { code: 'SEASIDE300K', ten: 'Kỳ nghỉ Seaside', gia_tri: 300000 },
    ],
  },
  {
    ma_khach_san: 5,
    tao_boi_id: 2,
    loai_giam: 'so_tien',
    items: [
      { code: 'PALACE80K', ten: 'Di sản Đà Lạt', gia_tri: 80000 },
      { code: 'PALACE120K', ten: 'Palace cuối tuần', gia_tri: 120000 },
      { code: 'PALACE150K', ten: 'Ưu đãi sương sớm', gia_tri: 150000 },
      { code: 'PALACE200K', ten: 'Heritage tiết kiệm', gia_tri: 200000 },
    ],
  },
  {
    ma_khach_san: 6,
    tao_boi_id: 2,
    loai_giam: 'so_tien',
    items: [
      { code: 'SUNRISE70K', ten: 'Bình minh Quy Nhơn', gia_tri: 70000 },
      { code: 'SUNRISE100K', ten: 'Sunrise cuối tuần', gia_tri: 100000 },
      { code: 'SUNRISE150K', ten: 'Ưu đãi bãi biển', gia_tri: 150000 },
      { code: 'SUNRISE200K', ten: 'Deal nắng vàng', gia_tri: 200000 },
    ],
  },
  {
    ma_khach_san: 7,
    tao_boi_id: 2,
    loai_giam: 'so_tien',
    items: [
      { code: 'LARITA50K', ten: 'Larita Boutique', gia_tri: 50000 },
      { code: 'LARITA80K', ten: 'Đà Lạt lãng mạn', gia_tri: 80000 },
      { code: 'LARITA100K', ten: 'Ưu đãi boutique', gia_tri: 100000 },
      { code: 'LARITA150K', ten: 'Flash deal Larita', gia_tri: 150000 },
    ],
  },
  {
    ma_khach_san: 8,
    tao_boi_id: 2,
    loai_giam: 'so_tien',
    items: [
      { code: 'LUXE50K', ten: 'Luxe Đà Lạt', gia_tri: 50000 },
      { code: 'LUXE80K', ten: 'Ưu đãi sang trọng', gia_tri: 80000 },
      { code: 'LUXE120K', ten: 'Luxe cuối tuần', gia_tri: 120000 },
      { code: 'LUXE150K', ten: 'Deal tiết kiệm Luxe', gia_tri: 150000 },
    ],
  },
  {
    ma_khach_san: 9,
    tao_boi_id: 2,
    loai_giam: 'so_tien',
    items: [
      { code: 'MILAN50K', ten: 'Homestay The Song', gia_tri: 50000 },
      { code: 'MILAN80K', ten: 'Milan cuối tuần', gia_tri: 80000 },
      { code: 'MILAN100K', ten: 'Ưu đãi gần biển', gia_tri: 100000 },
      { code: 'MILAN150K', ten: 'Deal gia đình Milan', gia_tri: 150000 },
    ],
  },

  {
    ma_khach_san: 10,
    tao_boi_id: 8,
    loai_giam: 'phan_tram',
    items: [
      { code: 'SIM15', ten: 'The Sim chào hè', gia_tri: 15 },
      { code: 'SIM20', ten: 'Sim cuối tuần', gia_tri: 20 },
      { code: 'SIM25', ten: 'Ưu đãi Vũng Tàu', gia_tri: 25 },
      { code: 'SIM35', ten: 'Flash deal The Sim', gia_tri: 35 },
    ],
  },
  {
    ma_khach_san: 11,
    tao_boi_id: 8,
    loai_giam: 'phan_tram',
    items: [
      { code: 'MOMENT15', ten: 'The Moment nghỉ dưỡng', gia_tri: 15 },
      { code: 'MOMENT20', ten: 'Moment cuối tuần', gia_tri: 20 },
      { code: 'MOMENT25', ten: 'Ưu đãi Quang Anh', gia_tri: 25 },
      { code: 'MOMENT30', ten: 'Deal tiết kiệm Moment', gia_tri: 30 },
    ],
  },
  {
    ma_khach_san: 12,
    tao_boi_id: 8,
    loai_giam: 'phan_tram',
    items: [
      { code: 'SUNHILL15', ten: 'Sun Hill chào hè', gia_tri: 15 },
      { code: 'SUNHILL20', ten: 'Đồi nắng cuối tuần', gia_tri: 20 },
      { code: 'SUNHILL25', ten: 'Ưu đãi Sun Hill', gia_tri: 25 },
      { code: 'SUNHILL30', ten: 'Flash deal Sun Hill', gia_tri: 30 },
    ],
  },

  {
    ma_khach_san: 13,
    tao_boi_id: 7,
    loai_giam: 'so_tien',
    items: [
      { code: 'HANA30K', ten: 'Hạ Na Đà Lạt', gia_tri: 30000 },
      { code: 'HANA50K', ten: 'Ưu đãi sương mù', gia_tri: 50000 },
      { code: 'HANA70K', ten: 'Hạ Na cuối tuần', gia_tri: 70000 },
      { code: 'HANA100K', ten: 'Deal tiết kiệm Hạ Na', gia_tri: 100000 },
    ],
  },
  {
    ma_khach_san: 14,
    tao_boi_id: 7,
    loai_giam: 'so_tien',
    items: [
      { code: 'BEE30K', ten: 'Bee Hill chào hè', gia_tri: 30000 },
      { code: 'BEE50K', ten: 'Bee cuối tuần', gia_tri: 50000 },
      { code: 'BEE70K', ten: 'Ưu đãi đồi thông', gia_tri: 70000 },
      { code: 'BEE100K', ten: 'Flash deal Bee Hill', gia_tri: 100000 },
    ],
  },
  {
    ma_khach_san: 15,
    tao_boi_id: 7,
    loai_giam: 'so_tien',
    items: [
      { code: 'VMT50K', ten: 'VMT chào hè', gia_tri: 50000 },
      { code: 'VMT80K', ten: 'VMT cuối tuần', gia_tri: 80000 },
      { code: 'VMT100K', ten: 'Ưu đãi tiết kiệm VMT', gia_tri: 100000 },
      { code: 'VMT150K', ten: 'Deal nóng VMT', gia_tri: 150000 },
    ],
  },
  {
    ma_khach_san: 16,
    tao_boi_id: 7,
    loai_giam: 'so_tien',
    items: [
      { code: 'PEACE50K', ten: 'Peace House thư giãn', gia_tri: 50000 },
      { code: 'PEACE80K', ten: 'Peace cuối tuần', gia_tri: 80000 },
      { code: 'PEACE100K', ten: 'Ưu đãi yên bình', gia_tri: 100000 },
      { code: 'PEACE150K', ten: 'Deal nghỉ dưỡng Peace', gia_tri: 150000 },
    ],
  },

  {
    ma_khach_san: 17,
    tao_boi_id: 6,
    loai_giam: 'phan_tram',
    items: [
      { code: 'SALA15', ten: 'Sala Beach chào hè', gia_tri: 15 },
      { code: 'SALA20', ten: 'Sala cuối tuần', gia_tri: 20 },
      { code: 'SALA25', ten: 'Ưu đãi view biển Sala', gia_tri: 25 },
      { code: 'SALA35', ten: 'Flash deal Sala', gia_tri: 35 },
    ],
  },
  {
    ma_khach_san: 18,
    tao_boi_id: 6,
    loai_giam: 'phan_tram',
    items: [
      { code: 'ODIN15', ten: 'Odin Quy Nhơn', gia_tri: 15 },
      { code: 'ODIN20', ten: 'Odin cuối tuần', gia_tri: 20 },
      { code: 'ODIN25', ten: 'Ưu đãi Odin', gia_tri: 25 },
      { code: 'ODIN30', ten: 'Deal tiết kiệm Odin', gia_tri: 30 },
    ],
  },
  {
    ma_khach_san: 19,
    tao_boi_id: 6,
    loai_giam: 'phan_tram',
    items: [
      { code: 'FLC15', ten: 'FLC Seaview', gia_tri: 15 },
      { code: 'FLC20', ten: 'FLC cuối tuần', gia_tri: 20 },
      { code: 'FLC25', ten: 'Ưu đãi view biển FLC', gia_tri: 25 },
      { code: 'FLC40', ten: 'Deal nghỉ dưỡng FLC', gia_tri: 40 },
    ],
  },
  {
    ma_khach_san: 21,
    tao_boi_id: 6,
    loai_giam: 'phan_tram',
    items: [
      { code: 'FLEUR15', ten: 'Fleur de Lys hè', gia_tri: 15 },
      { code: 'FLEUR20', ten: 'Fleur cuối tuần', gia_tri: 20 },
      { code: 'FLEUR25', ten: 'Ưu đãi Fleur de Lys', gia_tri: 25 },
      { code: 'FLEUR30', ten: 'Flash deal Fleur', gia_tri: 30 },
    ],
  },
  {
    ma_khach_san: 22,
    tao_boi_id: 6,
    loai_giam: 'phan_tram',
    items: [
      { code: 'LAMOR15', ten: "L'amor Boutique", gia_tri: 15 },
      { code: 'LAMOR20', ten: "L'amor cuối tuần", gia_tri: 20 },
      { code: 'LAMOR25', ten: 'Ưu đãi lãng mạn', gia_tri: 25 },
      { code: 'LAMOR35', ten: "Deal tiết kiệm L'amor", gia_tri: 35 },
    ],
  },
];

async function main() {
  const rows = [];
  let usageIndex = 0;

  for (const hotel of HOTEL_PROMOS) {
    for (const item of hotel.items) {
      rows.push({
        tao_boi_id: hotel.tao_boi_id,
        ma_khach_san: hotel.ma_khach_san,
        ma_code: item.code,
        ten: item.ten,
        loai_nguon: 'doi_tac',
        loai_giam: hotel.loai_giam,
        gia_tri: item.gia_tri,
        giam_toi_da: hotel.loai_giam === 'phan_tram' ? 500000 : null,
        don_hang_toi_thieu: 0,
        ngay_bat_dau: START,
        ngay_ket_thuc: END,
        so_luot_toi_da: 1 + (usageIndex % 10),
        so_luot_da_dung: 0,
        trang_thai: 'hoat_dong',
      });
      usageIndex += 1;
    }
  }

  const codes = rows.map((r) => r.ma_code);
  const existing = await prisma.khuyen_mai.findMany({
    where: { ma_code: { in: codes } },
    select: { ma_code: true },
  });
  const existingSet = new Set(existing.map((e) => e.ma_code));
  const toCreate = rows.filter((r) => !existingSet.has(r.ma_code));

  if (toCreate.length === 0) {
    console.log('Không có mã mới cần tạo (đã tồn tại hết).');
    return;
  }

  const result = await prisma.khuyen_mai.createMany({ data: toCreate });
  console.log(`Đã tạo ${result.count}/${rows.length} khuyến mãi.`);
  if (existingSet.size > 0) {
    console.log(`Bỏ qua ${existingSet.size} mã đã tồn tại: ${[...existingSet].join(', ')}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
