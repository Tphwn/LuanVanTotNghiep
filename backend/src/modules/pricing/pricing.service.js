const prisma = require('../../config/prisma');

const pricingService = {

  // Lấy danh sách KS của đối tác
  getMyHotels: async (doiTacId) => {
    return await prisma.khach_san.findMany({
      where: {
        ma_doi_tac: doiTacId,
        trang_thai: { in: ['da_duyet', 'hoat_dong'] },
      },
      select: {
        ma_khach_san: true,
        ten: true,
        loai_phong: {
          where: { trang_thai: 'hoat_dong' },
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            gia_co_ban: true,
            so_luong_phong: true,
          },
        },
      },
    });
  },

  // Lấy lịch giá của 1 loại phòng
  getPriceCalendar: async (maLoaiPhong, tuNgay, denNgay) => {
    return await prisma.bang_gia_phong.findMany({
      where: {
        ma_loai_phong: Number(maLoaiPhong),
        ngay: {
          gte: new Date(tuNgay),
          lte: new Date(denNgay),
        },
      },
      orderBy: { ngay: 'asc' },
    });
  },

  // Lưu giá hàng loạt cho nhiều loại phòng + nhiều ngày
  savePrices: async (entries) => {
    // entries = [{ ma_loai_phong, ngay, don_gia, loai_gia }]
    const results = [];

    for (const entry of entries) {
      const { ma_loai_phong, ngay, don_gia, loai_gia } = entry;

      const result = await prisma.bang_gia_phong.upsert({
        where: {
          uq_bgp: {
            ma_loai_phong: Number(ma_loai_phong),
            ngay: new Date(ngay),
          },
        },
        update: { don_gia: Number(don_gia), loai_gia },
        create: {
          ma_loai_phong: Number(ma_loai_phong),
          ngay: new Date(ngay),
          don_gia: Number(don_gia),
          loai_gia,
        },
      });
      results.push(result);
    }
    return results;
  },

  deletePrice: async (maLoaiPhong, ngay) => {
    return await prisma.bang_gia_phong.deleteMany({
      where: {
        ma_loai_phong: Number(maLoaiPhong),
        ngay: new Date(ngay),
      },
    });
  },
};

module.exports = pricingService;