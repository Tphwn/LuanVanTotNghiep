const prisma = require('../../config/prisma');

const formatDateKey = (d) => {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseLocalDate = (str) => {
  const [y, m, d] = String(str).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
};

const getDefaultLoaiGia = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`).getDay();
  return d === 0 || d === 6 ? 'cuoi_tuan' : 'co_ban';
};

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

  // Lịch quản lý giá + kho + đặt phòng theo ngày
  getManagementCalendar: async (maLoaiPhong, tuNgay, denNgay) => {
    const roomId = Number(maLoaiPhong);
    const room = await prisma.loai_phong.findUnique({
      where: { ma_loai_phong: roomId },
      select: {
        ma_loai_phong: true,
        ten_loai: true,
        gia_co_ban: true,
        so_luong_phong: true,
        so_luong_mo_ban: true,
        trang_thai: true,
        ma_khach_san: true,
      },
    });
    if (!room) throw new Error('Không tìm thấy loại phòng');

    const start = parseLocalDate(tuNgay);
    const end = parseLocalDate(denNgay);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const priceRows = await prisma.bang_gia_phong.findMany({
      where: {
        ma_loai_phong: roomId,
        ngay: { gte: start, lte: end },
      },
    });
    const priceMap = new Map(priceRows.map((p) => [formatDateKey(p.ngay), p]));

    const bookings = await prisma.dat_phong.findMany({
      where: {
        ma_loai_phong: roomId,
        trang_thai: { in: ['cho_xac_nhan', 'da_xac_nhan', 'da_checkin', 'hoan_thanh'] },
        ngay_nhan_phong: { lte: end },
        ngay_tra_phong: { gt: start },
      },
      select: { ngay_nhan_phong: true, ngay_tra_phong: true },
    });

    const moBanBase = room.trang_thai === 'an' ? 0 : Number(room.so_luong_mo_ban);
    const tongPhong = Number(room.so_luong_phong);
    const giaCoBan = Number(room.gia_co_ban);

    const days = [];
    const cur = new Date(start);
    cur.setHours(0, 0, 0, 0);
    const endDay = new Date(end);
    endDay.setHours(0, 0, 0, 0);

    while (cur <= endDay) {
      const key = formatDateKey(cur);
      const priceRow = priceMap.get(key);
      const donGia = priceRow ? Number(priceRow.don_gia) : giaCoBan;

      const nightStart = new Date(cur);
      nightStart.setHours(0, 0, 0, 0);
      const daDat = bookings.filter((b) => {
        const checkIn = new Date(b.ngay_nhan_phong);
        const checkOut = new Date(b.ngay_tra_phong);
        checkIn.setHours(0, 0, 0, 0);
        checkOut.setHours(0, 0, 0, 0);
        return nightStart >= checkIn && nightStart < checkOut;
      }).length;

      days.push({
        ngay: key,
        don_gia: donGia,
        gia_co_ban: giaCoBan,
        loai_gia: priceRow?.loai_gia || getDefaultLoaiGia(key),
        gia_tuy_chinh: priceRow != null && donGia !== giaCoBan,
        so_luong_ap_dung: priceRow?.so_luong_ap_dung != null
          ? Number(priceRow.so_luong_ap_dung)
          : null,
        tong_phong: tongPhong,
        mo_ban: moBanBase,
        con_lai: Math.max(moBanBase - daDat, 0),
        da_dat: daDat,
      });
      cur.setDate(cur.getDate() + 1);
    }

    return {
      room: {
        ma_loai_phong: room.ma_loai_phong,
        ten_loai: room.ten_loai,
        gia_co_ban: giaCoBan,
        tong_phong: tongPhong,
        mo_ban: moBanBase,
        trang_thai: room.trang_thai,
      },
      days,
    };
  },

  // Lấy lịch giá của 1 loại phòng
  getPriceCalendar: async (maLoaiPhong, tuNgay, denNgay) => {
    return await prisma.bang_gia_phong.findMany({
      where: {
        ma_loai_phong: Number(maLoaiPhong),
        ngay: {
          gte: parseLocalDate(tuNgay),
          lte: parseLocalDate(denNgay),
        },
      },
      orderBy: { ngay: 'asc' },
    });
  },

  // Lưu giá hàng loạt cho nhiều loại phòng + nhiều ngày
  savePrices: async (entries) => {
    const results = [];

    for (const entry of entries) {
      const { ma_loai_phong, ngay, don_gia, loai_gia, so_luong_ap_dung } = entry;
      if (!ma_loai_phong || !ngay) {
        throw new Error('Mỗi bản ghi giá cần có ma_loai_phong và ngay');
      }

      const ngayDate = parseLocalDate(ngay);
      const apDung = so_luong_ap_dung != null && so_luong_ap_dung !== ''
        ? Number(so_luong_ap_dung)
        : null;

      const result = await prisma.bang_gia_phong.upsert({
        where: {
          ma_loai_phong_ngay: {
            ma_loai_phong: Number(ma_loai_phong),
            ngay: ngayDate,
          },
        },
        update: {
          don_gia: Number(don_gia),
          loai_gia,
          so_luong_ap_dung: apDung,
        },
        create: {
          ma_loai_phong: Number(ma_loai_phong),
          ngay: ngayDate,
          don_gia: Number(don_gia),
          loai_gia,
          so_luong_ap_dung: apDung,
        },
      });
      results.push(result);
    }
    return results;
  },

  deletePrice: async (maLoaiPhong, ngay) => {
    const roomId = Number(maLoaiPhong);
    if (!roomId || Number.isNaN(roomId)) {
      throw new Error('ma_loai_phong không hợp lệ');
    }
    if (!ngay) {
      throw new Error('ngay không hợp lệ');
    }

    return prisma.bang_gia_phong.deleteMany({
      where: {
        ma_loai_phong: roomId,
        ngay: parseLocalDate(ngay),
      },
    });
  },

  deletePricesBulk: async (items = []) => {
    const conditions = items
      .map((item) => ({
        ma_loai_phong: Number(item.maLoaiPhong ?? item.ma_loai_phong),
        ngay: item.ngay,
      }))
      .filter((item) => item.ma_loai_phong && !Number.isNaN(item.ma_loai_phong) && item.ngay);

    if (!conditions.length) return { count: 0 };

    return prisma.bang_gia_phong.deleteMany({
      where: {
        OR: conditions.map((item) => ({
          ma_loai_phong: item.ma_loai_phong,
          ngay: parseLocalDate(item.ngay),
        })),
      },
    });
  },
};

module.exports = pricingService;