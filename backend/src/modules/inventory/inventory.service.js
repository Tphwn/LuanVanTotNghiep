const prisma = require('../../config/prisma');

const ACTIVE_BOOKING_STATUS = ['cho_xac_nhan', 'da_xac_nhan'];

const getToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const assertRoomOwnership = async (maLoaiPhong, doiTacId) => {
  const room = await prisma.loai_phong.findFirst({
    where: {
      ma_loai_phong: Number(maLoaiPhong),
      khach_san: { ma_doi_tac: doiTacId },
    },
    include: { khach_san: { select: { ten: true, ma_khach_san: true } } },
  });
  if (!room) throw new Error('Không tìm thấy loại phòng hoặc không có quyền');
  return room;
};

const countBookedRooms = async (maLoaiPhong) => {
  const today = getToday();
  return prisma.dat_phong.count({
    where: {
      ma_loai_phong: Number(maLoaiPhong),
      trang_thai: { in: ACTIVE_BOOKING_STATUS },
      ngay_tra_phong: { gte: today },
    },
  });
};

const mapInventoryRow = async (room) => {
  const tongPhong = Number(room.so_luong_phong);
  const moBan = Number(room.so_luong_mo_ban ?? 0);
  const daDat = await countBookedRooms(room.ma_loai_phong);
  const conLai = Math.max(moBan - daDat, 0);

  let trang_thai_hien_thi = 'dang_ban';
  if (room.trang_thai === 'an') {
    trang_thai_hien_thi = 'da_khoa';
  } else if (moBan === 0) {
    trang_thai_hien_thi = 'dong_ban';
  }

  return {
    ma_loai_phong: room.ma_loai_phong,
    ten_loai: room.ten_loai,
    ma_khach_san: room.ma_khach_san,
    ten_khach_san: room.khach_san?.ten,
    tong_phong: tongPhong,
    da_dat: daDat,
    con_lai: conLai,
    mo_ban: moBan,
    trang_thai: room.trang_thai,
    trang_thai_hien_thi,
  };
};

const inventoryService = {
  getHotels: async (doiTacId) => {
    return prisma.khach_san.findMany({
      where: { ma_doi_tac: doiTacId },
      select: { ma_khach_san: true, ten: true },
      orderBy: { ten: 'asc' },
    });
  },

  getInventory: async (doiTacId, { ma_khach_san, ma_loai_phong } = {}) => {
    const where = {
      khach_san: { ma_doi_tac: doiTacId },
    };
    if (ma_khach_san) where.ma_khach_san = Number(ma_khach_san);
    if (ma_loai_phong) where.ma_loai_phong = Number(ma_loai_phong);

    const rooms = await prisma.loai_phong.findMany({
      where,
      include: { khach_san: { select: { ten: true, ma_khach_san: true } } },
      orderBy: [{ ma_khach_san: 'asc' }, { ten_loai: 'asc' }],
    });

    const items = await Promise.all(rooms.map(mapInventoryRow));

    const stats = {
      tong_so_phong: items.reduce((s, i) => s + i.tong_phong, 0),
      so_loai_phong: items.length,
      dang_mo_ban: items
        .filter((i) => i.trang_thai_hien_thi === 'dang_ban')
        .reduce((s, i) => s + i.mo_ban, 0),
      da_khoa: items.filter((i) => i.trang_thai_hien_thi === 'da_khoa').length,
    };

    const roomTypes = ma_khach_san
      ? await prisma.loai_phong.findMany({
        where: { ma_khach_san: Number(ma_khach_san) },
        select: { ma_loai_phong: true, ten_loai: true },
        orderBy: { ten_loai: 'asc' },
      })
      : [];

    return { stats, items, roomTypes };
  },

  updateOpenSale: async (maLoaiPhong, so_luong_mo_ban, doiTacId) => {
    const room = await assertRoomOwnership(maLoaiPhong, doiTacId);
    if (room.trang_thai === 'an') {
      throw new Error('Loại phòng đang bị khóa, không thể điều chỉnh mở bán');
    }

    const qty = Number(so_luong_mo_ban);
    if (Number.isNaN(qty) || qty < 0) {
      throw new Error('Số lượng mở bán không hợp lệ');
    }
    if (qty > room.so_luong_phong) {
      throw new Error(`Số lượng mở bán không được vượt quá tổng phòng (${room.so_luong_phong})`);
    }

    const daDat = await countBookedRooms(maLoaiPhong);
    if (qty < daDat) {
      throw new Error(`Không thể đặt thấp hơn số phòng đã đặt (${daDat})`);
    }

    await prisma.loai_phong.update({
      where: { ma_loai_phong: Number(maLoaiPhong) },
      data: { so_luong_mo_ban: qty },
    });

    return mapInventoryRow({
      ...room,
      so_luong_mo_ban: qty,
    });
  },

  closeSale: async (maLoaiPhong, doiTacId) => {
    const room = await assertRoomOwnership(maLoaiPhong, doiTacId);
    await prisma.loai_phong.update({
      where: { ma_loai_phong: Number(maLoaiPhong) },
      data: { so_luong_mo_ban: 0 },
    });
    return mapInventoryRow({ ...room, so_luong_mo_ban: 0 });
  },

  reopenSale: async (maLoaiPhong, doiTacId) => {
    const room = await assertRoomOwnership(maLoaiPhong, doiTacId);
    if (room.trang_thai === 'an') {
      throw new Error('Loại phòng đang bị khóa, hãy mở khóa trước khi mở bán');
    }
    const qty = Number(room.so_luong_phong);
    await prisma.loai_phong.update({
      where: { ma_loai_phong: Number(maLoaiPhong) },
      data: { so_luong_mo_ban: qty },
    });
    return mapInventoryRow({ ...room, so_luong_mo_ban: qty });
  },
};

module.exports = inventoryService;
