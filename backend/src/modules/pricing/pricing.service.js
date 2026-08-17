const prisma = require('../../config/prisma');
const { ACTIVE_BOOKING } = require('../../utils/bookingHelpers');

const formatDateKey = (d) => {
  if (!d) return '';
  if (typeof d === 'string') {
    const part = d.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) return part;
  }
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const parseLocalDate = (str) => {
  const part = String(str).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(part)) {
    throw new Error(`Ngày không hợp lệ: ${str}`);
  }
  return new Date(`${part}T00:00:00.000Z`);
};

const nextDateKey = (key) => {
  const cur = parseLocalDate(key);
  return formatDateKey(
    new Date(Date.UTC(cur.getUTCFullYear(), cur.getUTCMonth(), cur.getUTCDate() + 1)),
  );
};

const getDefaultLoaiGia = (dateStr) => {
  const d = new Date(`${dateStr}T12:00:00`).getDay();
  return d === 0 || d === 6 ? 'cuoi_tuan' : 'co_ban';
};

const VALID_LOAI_GIA = new Set(['co_ban', 'cuoi_tuan', 'le_tet', 'cao_diem']);

const pricingService = {

  getMyHotels: async (doiTacId) => {
    return await prisma.khach_san.findMany({
      where: {
        ma_doi_tac: doiTacId,
        trang_thai: { in: ['da_duyet', 'hoat_dong', 'bi_khoa'] },
      },
      select: {
        ma_khach_san: true,
        ten: true,
        dia_chi: true,
        so_sao: true,
        trang_thai: true,
        khoa_do_doi_tac: true,
        dia_diem: { select: { ten_dia_diem: true } },
        loai_phong: {
          where: { trang_thai: { in: ['hoat_dong', 'an'] } },
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            gia_co_ban: true,
            so_luong_phong: true,
            trang_thai: true,
          },
          orderBy: { ten_loai: 'asc' },
        },
        _count: { select: { loai_phong: true } },
      },
      orderBy: { ten: 'asc' },
    });
  },
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

    const startKey = String(tuNgay).slice(0, 10);
    const endKey = String(denNgay).slice(0, 10);
    const start = parseLocalDate(startKey);
    const end = parseLocalDate(endKey);

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
        trang_thai: { in: ACTIVE_BOOKING },
        ngay_nhan_phong: { lte: end },
        ngay_tra_phong: { gt: start },
      },
      select: { ngay_nhan_phong: true, ngay_tra_phong: true },
    });

    const moBanBase = room.trang_thai === 'an' ? 0 : Number(room.so_luong_mo_ban);
    const tongPhong = Number(room.so_luong_phong);
    const giaCoBan = Number(room.gia_co_ban);

    const days = [];
    let key = startKey;
    while (key <= endKey) {
      const priceRow = priceMap.get(key);
      const donGia = priceRow ? Number(priceRow.don_gia) : giaCoBan;

      const nightStart = parseLocalDate(key);
      const daDat = bookings.filter((b) => {
        const checkIn = parseLocalDate(formatDateKey(b.ngay_nhan_phong));
        const checkOut = parseLocalDate(formatDateKey(b.ngay_tra_phong));
        return nightStart >= checkIn && nightStart < checkOut;
      }).length;

      const moBanDay = priceRow?.so_luong_ap_dung != null
        ? Number(priceRow.so_luong_ap_dung)
        : moBanBase;
      const conLai = Math.max(moBanDay - daDat, 0);

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
        mo_ban: moBanDay,
        con_lai: conLai,
        da_dat: daDat,
      });
      key = nextDateKey(key);
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
    return prisma.$transaction(async (tx) => {
      const results = [];
      const seen = new Set();

      for (const entry of entries) {
        const { ma_loai_phong, ngay, don_gia, loai_gia, so_luong_ap_dung } = entry;
        if (!ma_loai_phong || !ngay) {
          throw new Error('Mỗi bản ghi giá cần có ma_loai_phong và ngay');
        }

        const ngayKey = String(ngay).slice(0, 10);
        const maLoai = Number(ma_loai_phong);
        const dedupeKey = `${maLoai}:${ngayKey}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        const ngayDate = parseLocalDate(ngayKey);
        const apDung = so_luong_ap_dung != null && so_luong_ap_dung !== ''
          ? Number(so_luong_ap_dung)
          : null;
        if (!loai_gia || !VALID_LOAI_GIA.has(String(loai_gia))) {
          throw new Error('Loại giá không hợp lệ');
        }
        const payload = {
          don_gia: Number(don_gia),
          loai_gia: String(loai_gia),
          so_luong_ap_dung: apDung,
          ngay: ngayDate,
        };

        const existingRows = await tx.$queryRaw`
          SELECT ma_bang_gia
          FROM bang_gia_phong
          WHERE ma_loai_phong = ${maLoai}
            AND ngay = ${ngayKey}
          LIMIT 1
        `;

        let result;
        if (existingRows.length > 0) {
          result = await tx.bang_gia_phong.update({
            where: { ma_bang_gia: Number(existingRows[0].ma_bang_gia) },
            data: payload,
          });
        } else {
          result = await tx.bang_gia_phong.create({
            data: {
              ma_loai_phong: maLoai,
              ...payload,
            },
          });
        }
        results.push(result);
      }
      return results;
    });
  },

  deletePrice: async (maLoaiPhong, ngay) => {
    const roomId = Number(maLoaiPhong);
    if (!roomId || Number.isNaN(roomId)) {
      throw new Error('ma_loai_phong không hợp lệ');
    }
    if (!ngay) {
      throw new Error('ngay không hợp lệ');
    }

    const ngayKey = String(ngay).slice(0, 10);
    const deleted = await prisma.$executeRaw`
      DELETE FROM bang_gia_phong
      WHERE ma_loai_phong = ${roomId}
        AND ngay = ${ngayKey}
    `;
    return { count: Number(deleted) || 0 };
  },

  deletePricesBulk: async (items = []) => {
    const conditions = items
      .map((item) => ({
        ma_loai_phong: Number(item.maLoaiPhong ?? item.ma_loai_phong),
        ngay: String(item.ngay).slice(0, 10),
      }))
      .filter((item) => item.ma_loai_phong && !Number.isNaN(item.ma_loai_phong) && item.ngay);

    if (!conditions.length) return { count: 0 };

    let total = 0;
    for (const item of conditions) {
      const deleted = await prisma.$executeRaw`
        DELETE FROM bang_gia_phong
        WHERE ma_loai_phong = ${item.ma_loai_phong}
          AND ngay = ${item.ngay}
      `;
      total += Number(deleted) || 0;
    }
    return { count: total };
  },

  // Khôi phục đơn giá về giá cơ bản của loại phòng (giữ số phòng mở bán nếu có)
  restoreBasePrices: async (maLoaiPhong, dates = []) => {
    const roomId = Number(maLoaiPhong);
    if (!roomId || Number.isNaN(roomId)) {
      throw new Error('ma_loai_phong không hợp lệ');
    }

    const ngayList = [...new Set(
      (dates || [])
        .map((d) => String(d).slice(0, 10))
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)),
    )];
    if (!ngayList.length) {
      throw new Error('Cần chọn ít nhất một ngày để khôi phục');
    }

    const room = await prisma.loai_phong.findUnique({
      where: { ma_loai_phong: roomId },
      select: { gia_co_ban: true },
    });
    if (!room) throw new Error('Không tìm thấy loại phòng');

    const giaCoBan = Number(room.gia_co_ban);
    let restored = 0;

    for (const ngayKey of ngayList) {
      const rows = await prisma.$queryRaw`
        SELECT ma_bang_gia, don_gia, so_luong_ap_dung
        FROM bang_gia_phong
        WHERE ma_loai_phong = ${roomId}
          AND ngay = ${ngayKey}
        LIMIT 1
      `;
      if (!rows.length) continue;

      const row = rows[0];
      const currentPrice = Number(row.don_gia);
      if (currentPrice === giaCoBan) continue;

      if (row.so_luong_ap_dung == null) {
        await prisma.$executeRaw`
          DELETE FROM bang_gia_phong
          WHERE ma_bang_gia = ${Number(row.ma_bang_gia)}
        `;
      } else {
        await prisma.bang_gia_phong.update({
          where: { ma_bang_gia: Number(row.ma_bang_gia) },
          data: {
            don_gia: giaCoBan,
            loai_gia: getDefaultLoaiGia(ngayKey),
          },
        });
      }
      restored += 1;
    }

    return { count: restored, gia_co_ban: giaCoBan };
  },
};

module.exports = pricingService;