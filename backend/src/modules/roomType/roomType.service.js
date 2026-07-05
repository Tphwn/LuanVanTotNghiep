const prisma = require('../../config/prisma');
const { isLockedByAdminRoom } = require('../../utils/partnerLockHelpers');

const roomService = {

  // Lấy ds loại phòng của 1 KS (thuộc đối tác)
  getByHotel: async (maKhachSan, doiTacId) => {
    // Kiểm tra KS thuộc đối tác
    const ks = await prisma.khach_san.findFirst({
      where: { ma_khach_san: Number(maKhachSan), ma_doi_tac: doiTacId },
    });
    if (!ks) throw new Error('Không có quyền truy cập khách sạn này');

    return await prisma.loai_phong.findMany({
      where: { ma_khach_san: Number(maKhachSan) },
      include: {
        loai_phong_tien_nghi: { include: { tien_nghi: true } },
        hinh_anh: { orderBy: { thu_tu: 'asc' } },
      },
      orderBy: { ngay_tao: 'desc' },
    });
  },

  // Lấy chi tiết 1 loại phòng
  getById: async (id) => {
    return await prisma.loai_phong.findUnique({
      where: { ma_loai_phong: Number(id) },
      include: {
        khach_san: { select: { ten: true, ma_doi_tac: true } },
        loai_phong_tien_nghi: { include: { tien_nghi: true } },
        hinh_anh: { orderBy: { thu_tu: 'asc' } },
      },
    });
  },

  // Tạo loại phòng mới
  create: async (data, maKhachSan, doiTacId) => {
    // Kiểm tra KS thuộc đối tác
    const ks = await prisma.khach_san.findFirst({
      where: { ma_khach_san: Number(maKhachSan), ma_doi_tac: doiTacId },
    });
    if (!ks) throw new Error('Không có quyền truy cập khách sạn này');

    const {
      ten_loai, dien_tich, suc_chua, so_luong_phong,
      gia_co_ban, mo_ta, so_giuong = 1, tien_nghi_ids = [],
    } = data;

    return await prisma.loai_phong.create({
      data: {
        ma_khach_san: Number(maKhachSan),
        ten_loai,
        dien_tich: dien_tich ? Number(dien_tich) : null,
        suc_chua: Number(suc_chua),
        so_luong_phong: Number(so_luong_phong),
        so_luong_mo_ban: Number(so_luong_phong),
        gia_co_ban: Number(gia_co_ban),
        mo_ta,
        so_giuong: Number(so_giuong),
        trang_thai: 'hoat_dong',
        loai_phong_tien_nghi: {
          create: tien_nghi_ids.map(id => ({
            ma_tien_nghi: Number(id),
          })),
        },
      },
      include: {
        loai_phong_tien_nghi: { include: { tien_nghi: true } },
        hinh_anh: true,
      },
    });
  },

  // Cập nhật loại phòng
  update: async (id, data, doiTacId) => {
    // Kiểm tra quyền
    const room = await prisma.loai_phong.findUnique({
      where: { ma_loai_phong: Number(id) },
      include: { khach_san: { select: { ma_doi_tac: true } } },
    });
    if (!room) throw new Error('Không tìm thấy loại phòng');
    if (room.khach_san.ma_doi_tac !== doiTacId) throw new Error('Không có quyền');

    const {
      ten_loai, dien_tich, suc_chua, so_luong_phong,
      gia_co_ban, mo_ta, so_giuong, tien_nghi_ids = [],
    } = data;

    // Xóa tiện nghi cũ rồi tạo lại
    await prisma.loai_phong_tien_nghi.deleteMany({
      where: { ma_loai_phong: Number(id) },
    });

    return await prisma.loai_phong.update({
      where: { ma_loai_phong: Number(id) },
      data: {
        ten_loai,
        dien_tich: dien_tich ? Number(dien_tich) : null,
        suc_chua: Number(suc_chua),
        so_luong_phong: Number(so_luong_phong),
        so_luong_mo_ban: (() => {
          const oldTong = Number(room.so_luong_phong) || 0;
          const oldMoBan = Number(room.so_luong_mo_ban) || 0;
          const newTong = Number(so_luong_phong);
          if (room.trang_thai !== 'hoat_dong') return oldMoBan;
          if (oldTong > 0 && oldMoBan >= oldTong) return newTong;
          if (oldMoBan > 0 && newTong > oldTong) {
            return Math.min(oldMoBan + (newTong - oldTong), newTong);
          }
          if (newTong < oldTong) return Math.min(oldMoBan, newTong);
          return oldMoBan;
        })(),
        gia_co_ban: Number(gia_co_ban),
        mo_ta,
        so_giuong: Number(so_giuong),
        loai_phong_tien_nghi: {
          create: tien_nghi_ids.map(id => ({
            ma_tien_nghi: Number(id),
          })),
        },
      },
      include: {
        loai_phong_tien_nghi: { include: { tien_nghi: true } },
        hinh_anh: true,
      },
    });
  },

  // Khóa / mở loại phòng (đối tác)
  toggleStatus: async (id, doiTacId) => {
    const room = await prisma.loai_phong.findUnique({
      where: { ma_loai_phong: Number(id) },
      include: { khach_san: { select: { ma_doi_tac: true } } },
    });
    if (!room) throw { statusCode: 404, message: 'Không tìm thấy loại phòng' };
    if (room.khach_san.ma_doi_tac !== doiTacId) throw { statusCode: 403, message: 'Không có quyền' };

    if (room.trang_thai === 'hoat_dong') {
      return prisma.loai_phong.update({
        where: { ma_loai_phong: Number(id) },
        data: {
          trang_thai: 'an',
          khoa_do_doi_tac: true,
          so_luong_mo_ban_truoc_khoa: room.so_luong_mo_ban,
          so_luong_mo_ban: 0,
        },
      });
    }

    if (isLockedByAdminRoom(room)) {
      throw { statusCode: 400, message: 'Loại phòng đang bị admin khóa. Bạn không thể mở khóa.' };
    }

    const moBan = Number(room.so_luong_mo_ban_truoc_khoa) > 0
      ? room.so_luong_mo_ban_truoc_khoa
      : (Number(room.so_luong_mo_ban) > 0 ? room.so_luong_mo_ban : room.so_luong_phong);

    return prisma.loai_phong.update({
      where: { ma_loai_phong: Number(id) },
      data: {
        trang_thai: 'hoat_dong',
        khoa_do_doi_tac: false,
        so_luong_mo_ban: moBan,
        so_luong_mo_ban_truoc_khoa: null,
      },
    });
  },

  // Lấy tiện nghi loại phòng (loai = phong hoặc ca_hai)
  getAmenitiesForRoom: async () => {
    return await prisma.tien_nghi.findMany({
      where: {
        loai: { in: ['phong', 'ca_hai'] },
        trang_thai: 'hoat_dong',
      },
      orderBy: { ten: 'asc' },
    });
  },

  // Lấy KS của đối tác (để filter)
  getMyHotels: async (doiTacId) => {
    return await prisma.khach_san.findMany({
      where: { ma_doi_tac: doiTacId },
      select: { ma_khach_san: true, ten: true, trang_thai: true },
      orderBy: { ngay_tao: 'desc' },
    });
  },
};

module.exports = roomService;