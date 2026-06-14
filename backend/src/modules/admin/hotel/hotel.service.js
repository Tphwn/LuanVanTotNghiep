const prisma = require('../../../config/prisma');

const attachImagesToHotel = async (hotel) => {
  const images = await prisma.hinh_anh.findMany({
    where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotel.ma_khach_san },
    orderBy: { thu_tu: 'asc' }
  });
  return { ...hotel, hinh_anh: images };
};

const hotelService = {
  getHotels: async () => {
    return prisma.khach_san.findMany({
      include: { dia_diem: true, doi_tac: true },
      orderBy: { ngay_tao: 'desc' }
    });
  },

  getById: async (id) => {
  const hotel = await prisma.khach_san.findUnique({
    where: { ma_khach_san: Number(id) },
    include: {
      dia_diem: true,
      doi_tac: true, // Lấy toàn bộ thông tin đối tác
      khach_san_tien_nghi: { include: { tien_nghi: true } },
    },
  });
  if (!hotel) return null;
  const images = await prisma.hinh_anh.findMany({
    where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: hotel.ma_khach_san }
  });
  return { ...hotel, hinh_anh: images };
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
      data: {
        trang_thai: 'bi_khoa',
      },
    });
  },

  unlockHotel: async (id) => {
    return prisma.khach_san.update({
      where: { ma_khach_san: Number(id) },
      data: {
        trang_thai: 'hoat_dong',
      },
    });
  },
};

module.exports = hotelService;
