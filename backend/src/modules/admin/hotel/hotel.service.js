const prisma = require('../../../config/prisma');

const attachImages = async (hotels) => {
  const ids = hotels.map((h) => h.ma_khach_san);
  if (!ids.length) return hotels.map((h) => ({ ...h, hinh_anh: [] }));

  const images = await prisma.hinh_anh.findMany({
    where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: { in: ids } },
    orderBy: { thu_tu: 'asc' },
  });

  const byHotel = images.reduce((acc, img) => {
    if (!acc[img.ma_doi_tuong]) acc[img.ma_doi_tuong] = [];
    acc[img.ma_doi_tuong].push(img);
    return acc;
  }, {});

  return hotels.map((h) => ({ ...h, hinh_anh: byHotel[h.ma_khach_san] || [] }));
};

const hotelService = {
  getHotels: async () => {
    const hotels = await prisma.khach_san.findMany({
      include: {
        dia_diem: true,
        doi_tac: { select: { ten_cong_ty: true, ma_doi_tac: true } },
        _count: { select: { loai_phong: true } },
      },
      orderBy: { ngay_tao: 'desc' },
    });
    return attachImages(hotels);
  },

  getById: async (id) => {
    const hotel = await prisma.khach_san.findUnique({
      where: { ma_khach_san: Number(id) },
      include: {
        dia_diem: true,
        doi_tac: {
          include: {
            nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung: {
              select: { email: true, so_dien_thoai: true },
            },
          },
        },
        khach_san_tien_nghi: { include: { tien_nghi: true } },
        loai_phong: {
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            gia_co_ban: true,
            suc_chua: true,
            so_luong_phong: true,
            trang_thai: true,
          },
          orderBy: { ten_loai: 'asc' },
        },
        _count: { select: { loai_phong: true } },
      },
    });
    if (!hotel) return null;

    const hinh_anh = await prisma.hinh_anh.findMany({
      where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotel.ma_khach_san },
      orderBy: { thu_tu: 'asc' },
    });

    return { ...hotel, hinh_anh };
  },

  approveHotel: async (id, adminId) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: {
        trang_thai: 'hoat_dong',
        duyet_boi_admin_id: Number(adminId),
        ngay_duyet: new Date(),
      },
    });
  },

  rejectHotel: async (id, adminId, lyDo) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: {
        trang_thai: 'tu_choi',
        ly_do_tu_choi: lyDo,
        duyet_boi_admin_id: Number(adminId),
        ngay_duyet: new Date(),
      },
    });
  },

  requestInfoHotel: async (id, adminId, ghiChu) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: {
        trang_thai: 'yeu_cau_sua',
        ly_do_tu_choi: ghiChu,
        duyet_boi_admin_id: Number(adminId),
        ngay_duyet: new Date(),
      },
    });
  },

  lockHotel: async (id) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: { trang_thai: 'bi_khoa' },
    });
  },

  unlockHotel: async (id) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: { trang_thai: 'hoat_dong' },
    });
  },
};

module.exports = hotelService;
