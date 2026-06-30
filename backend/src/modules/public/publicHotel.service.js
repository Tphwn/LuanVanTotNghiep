const prisma = require('../../config/prisma');
const { Prisma } = require('@prisma/client');
const { attachHotelImages, attachRoomImages } = require('../../utils/images');
const {
  parseDate,
  calcStayPrice,
  countOverlappingBookings,
} = require('../../utils/bookingHelpers');

const getAvailableRooms = async (rooms, checkIn, checkOut, soKhach) => {
  const eligible = rooms.filter(
    (r) => r.trang_thai === 'hoat_dong' && r.suc_chua >= soKhach && Number(r.so_luong_mo_ban) > 0
  );

  if (!checkIn || !checkOut) {
    return eligible.map((r) => ({
      ...r,
      gia_hien_thi: Number(r.gia_co_ban),
      phong_con_lai: Number(r.so_luong_mo_ban),
    }));
  }

  const available = [];
  for (const room of eligible) {
    const booked = await countOverlappingBookings(room.ma_loai_phong, checkIn, checkOut);
    const conLai = Number(room.so_luong_mo_ban) - booked;
    if (conLai > 0) {
      available.push({ ...room, gia_hien_thi: Number(room.gia_co_ban), phong_con_lai: conLai });
    }
  }
  return available;
};

const getHotelReviewStatsMap = async (hotelIds) => {
  if (!hotelIds.length) return {};
  const rows = await prisma.$queryRaw`
    SELECT lp.ma_khach_san AS ma_khach_san,
           COUNT(dg.ma_danh_gia) AS so_danh_gia,
           AVG(dg.so_sao) AS diem_trung_binh
    FROM loai_phong lp
    INNER JOIN dat_phong dp ON dp.ma_loai_phong = lp.ma_loai_phong
    INNER JOIN danh_gia dg ON dg.ma_dat_phong = dp.ma_dat_phong
      AND dg.trang_thai = 'hien_thi'
    WHERE lp.ma_khach_san IN (${Prisma.join(hotelIds)})
    GROUP BY lp.ma_khach_san
  `;
  return rows.reduce((acc, row) => {
    acc[Number(row.ma_khach_san)] = {
      so_danh_gia: Number(row.so_danh_gia) || 0,
      diem_trung_binh: row.diem_trung_binh != null
        ? Math.round(Number(row.diem_trung_binh) * 10) / 10
        : 0,
    };
    return acc;
  }, {});
};

const getRoomTypeReviewData = async (roomTypeId) => {
  const [statsRow] = await prisma.$queryRaw`
    SELECT COUNT(dg.ma_danh_gia) AS so_danh_gia,
           AVG(dg.so_sao) AS diem_trung_binh
    FROM danh_gia dg
    INNER JOIN dat_phong dp ON dp.ma_dat_phong = dg.ma_dat_phong
    WHERE dp.ma_loai_phong = ${Number(roomTypeId)}
      AND dg.trang_thai = 'hien_thi'
  `;

  const danh_gia = await prisma.danh_gia.findMany({
    where: {
      trang_thai: 'hien_thi',
      dat_phong: { ma_loai_phong: Number(roomTypeId) },
    },
    include: {
      khach_hang: { select: { ho_ten: true, anh_dai_dien: true } },
    },
    orderBy: { ngay_danh_gia: 'desc' },
    take: 15,
  });

  return {
    so_danh_gia: Number(statsRow?.so_danh_gia) || 0,
    diem_trung_binh: statsRow?.diem_trung_binh != null
      ? Math.round(Number(statsRow.diem_trung_binh) * 10) / 10
      : 0,
    danh_gia: danh_gia.map((dg) => ({
      ma_danh_gia: dg.ma_danh_gia,
      so_sao: dg.so_sao,
      noi_dung: dg.noi_dung,
      diem_sach_se: dg.diem_sach_se,
      diem_dich_vu: dg.diem_dich_vu,
      diem_vi_tri: dg.diem_vi_tri,
      diem_tien_nghi: dg.diem_tien_nghi,
      ngay_danh_gia: dg.ngay_danh_gia,
      khach_hang: dg.khach_hang,
    })),
  };
};

const publicHotelService = {
  getLocations: async () => {
    const locations = await prisma.dia_diem.findMany({
      orderBy: { ten_dia_diem: 'asc' },
      include: {
        _count: {
          select: {
            khach_san: { where: { trang_thai: 'hoat_dong' } },
          },
        },
      },
    });
    return locations.map((loc) => ({
      ma_dia_diem: loc.ma_dia_diem,
      ten_dia_diem: loc.ten_dia_diem,
      tinh_thanh: loc.tinh_thanh,
      quoc_gia: loc.quoc_gia,
      so_khach_san: loc._count.khach_san,
    }));
  },

  getPopularDestinations: async () => {
    const locations = await publicHotelService.getLocations();
    return locations
      .filter((l) => l.so_khach_san > 0)
      .sort((a, b) => b.so_khach_san - a.so_khach_san)
      .slice(0, 6);
  },

  getAmenityFilters: async () => {
    return prisma.tien_nghi.findMany({
      where: {
        trang_thai: 'hoat_dong',
        loai: { in: ['khach_san', 'ca_hai'] },
      },
      select: {
        ma_tien_nghi: true,
        ten: true,
        bieu_tuong: true,
        loai: true,
      },
      orderBy: { ten: 'asc' },
    });
  },

  /**
   * Danh sách khách sạn đang hoạt động trên web (menu Khách sạn).
   * Chỉ trả về khach_san có trang_thai = hoat_dong (đối tác đăng ký + admin duyệt).
   * Mỗi item = 1 khách sạn, kèm gia_tu (giá thấp nhất trong các loại phòng đang bán).
   */
  listHotels: async ({ ma_dia_diem } = {}) => {
    const where = { trang_thai: 'hoat_dong' };
    if (ma_dia_diem) where.ma_dia_diem = Number(ma_dia_diem);

    const hotels = await prisma.khach_san.findMany({
      where,
      include: {
        dia_diem: true,
        khach_san_tien_nghi: {
          include: { tien_nghi: { select: { ma_tien_nghi: true, ten: true, bieu_tuong: true } } },
        },
        loai_phong: {
          where: { trang_thai: 'hoat_dong', so_luong_mo_ban: { gt: 0 } },
          select: { gia_co_ban: true },
        },
        _count: {
          select: {
            loai_phong: { where: { trang_thai: 'hoat_dong' } },
          },
        },
      },
      orderBy: [{ so_sao: 'desc' }, { ten: 'asc' }],
    });

    const mapped = hotels
      .filter((h) => h.loai_phong.length > 0)
      .map((hotel) => {
        const prices = hotel.loai_phong.map((r) => Number(r.gia_co_ban));
        return {
          ma_khach_san: hotel.ma_khach_san,
          ten: hotel.ten,
          dia_chi: hotel.dia_chi,
          mo_ta: hotel.mo_ta,
          so_sao: hotel.so_sao,
          dia_diem: hotel.dia_diem,
          so_loai_phong: hotel._count.loai_phong,
          gia_tu: prices.length ? Math.min(...prices) : null,
          tien_nghi: hotel.khach_san_tien_nghi.map((t) => t.tien_nghi).filter(Boolean),
        };
      });

    const withImages = await attachHotelImages(mapped);
    const reviewMap = await getHotelReviewStatsMap(withImages.map((h) => h.ma_khach_san));

    return withImages.map((hotel) => ({
      ...hotel,
      so_danh_gia: reviewMap[hotel.ma_khach_san]?.so_danh_gia || 0,
      diem_trung_binh: reviewMap[hotel.ma_khach_san]?.diem_trung_binh || 0,
    }));
  },

  searchHotels: async ({ ma_dia_diem, ngay_nhan, ngay_tra, so_khach = 2 }) => {
    const checkIn = parseDate(ngay_nhan);
    const checkOut = parseDate(ngay_tra);
    const guests = Math.max(Number(so_khach) || 0, 0);

    if (!checkIn || !checkOut) {
      return publicHotelService.listHotels({ ma_dia_diem });
    }

    const where = { trang_thai: 'hoat_dong' };
    if (ma_dia_diem) where.ma_dia_diem = Number(ma_dia_diem);

    const hotels = await prisma.khach_san.findMany({
      where,
      include: {
        dia_diem: true,
        khach_san_tien_nghi: {
          include: { tien_nghi: { select: { ma_tien_nghi: true, ten: true, bieu_tuong: true } } },
        },
        loai_phong: {
          where: { trang_thai: 'hoat_dong' },
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            gia_co_ban: true,
            suc_chua: true,
            so_luong_mo_ban: true,
            so_luong_phong: true,
            trang_thai: true,
          },
        },
        _count: {
          select: {
            loai_phong: { where: { trang_thai: 'hoat_dong' } },
          },
        },
      },
      orderBy: [{ so_sao: 'desc' }, { ten: 'asc' }],
    });

    const hotelResults = [];

    for (const hotel of hotels) {
      const availableRooms = await getAvailableRooms(hotel.loai_phong, checkIn, checkOut, guests);
      if (!availableRooms.length) continue;

      const nightlyPrices = await Promise.all(
        availableRooms.map(async (room) => {
          const pricing = await calcStayPrice(room.ma_loai_phong, room.gia_co_ban, checkIn, checkOut);
          return pricing.gia_tu_dem;
        })
      );

      const giaTu = Math.min(...nightlyPrices);

      hotelResults.push({
        ma_khach_san: hotel.ma_khach_san,
        ten: hotel.ten,
        dia_chi: hotel.dia_chi,
        mo_ta: hotel.mo_ta,
        so_sao: hotel.so_sao,
        dia_diem: hotel.dia_diem,
        so_loai_phong: hotel._count.loai_phong,
        so_phong_trong: availableRooms.reduce((sum, r) => sum + (r.phong_con_lai || 0), 0),
        gia_tu: giaTu,
        tien_nghi: hotel.khach_san_tien_nghi.map((t) => t.tien_nghi).filter(Boolean),
      });
    }

    const withImages = await attachHotelImages(hotelResults);
    const reviewMap = await getHotelReviewStatsMap(withImages.map((h) => h.ma_khach_san));

    return withImages.map((hotel) => ({
      ...hotel,
      so_danh_gia: reviewMap[hotel.ma_khach_san]?.so_danh_gia || 0,
      diem_trung_binh: reviewMap[hotel.ma_khach_san]?.diem_trung_binh || 0,
    }));
  },

  /** @deprecated Dùng searchHotels — giữ để tương thích API cũ */
  searchRooms: async (params) => publicHotelService.searchHotels(params),

  getRoomById: async (hotelId, roomId, { ngay_nhan, ngay_tra, so_khach = 2 } = {}) => {
    const checkIn = parseDate(ngay_nhan);
    const checkOut = parseDate(ngay_tra);
    const guests = Math.max(Number(so_khach) || 0, 0);

    const hotel = await prisma.khach_san.findFirst({
      where: { ma_khach_san: Number(hotelId), trang_thai: 'hoat_dong' },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: {
          include: { tien_nghi: { select: { ma_tien_nghi: true, ten: true, bieu_tuong: true } } },
        },
        loai_phong: {
          where: { trang_thai: 'hoat_dong' },
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            gia_co_ban: true,
            suc_chua: true,
            so_luong_phong: true,
            so_luong_mo_ban: true,
            dien_tich: true,
            so_giuong: true,
            mo_ta: true,
            trang_thai: true,
            loai_phong_tien_nghi: {
              include: { tien_nghi: { select: { ma_tien_nghi: true, ten: true, bieu_tuong: true } } },
            },
          },
        },
      },
    });

    if (!hotel) return null;

    const availableRooms = await getAvailableRooms(hotel.loai_phong, checkIn, checkOut, guests);
    const target = availableRooms.find((r) => r.ma_loai_phong === Number(roomId));
    if (!target) return null;

    const pricing = await calcStayPrice(target.ma_loai_phong, target.gia_co_ban, checkIn, checkOut);
    const [roomWithImages] = await attachRoomImages([{
      ...target,
      gia_co_ban: Number(target.gia_co_ban),
      gia_hien_thi: pricing.gia_tu_dem,
      tong_gia: pricing.tong_luong_tru,
      so_dem: pricing.so_dem,
      tien_nghi: (target.loai_phong_tien_nghi || []).map((t) => t.tien_nghi).filter(Boolean),
    }]);

    const otherRooms = await Promise.all(
      availableRooms
        .filter((r) => r.ma_loai_phong !== Number(roomId))
        .map(async (room) => {
          const p = await calcStayPrice(room.ma_loai_phong, room.gia_co_ban, checkIn, checkOut);
          return {
            ...room,
            gia_co_ban: Number(room.gia_co_ban),
            gia_hien_thi: p.gia_tu_dem,
            tong_gia: p.tong_luong_tru,
            so_dem: p.so_dem,
          };
        })
    );
    const otherWithImages = await attachRoomImages(otherRooms);

    const [hotelWithImages] = await attachHotelImages([{
      ma_khach_san: hotel.ma_khach_san,
      ten: hotel.ten,
      dia_chi: hotel.dia_chi,
      mo_ta: hotel.mo_ta,
      so_sao: hotel.so_sao,
      gio_nhan_phong: hotel.gio_nhan_phong,
      gio_tra_phong: hotel.gio_tra_phong,
      dia_diem: hotel.dia_diem,
      tien_nghi: hotel.khach_san_tien_nghi.map((t) => t.tien_nghi).filter(Boolean),
    }]);

    const reviewData = await getRoomTypeReviewData(roomId);

    return {
      ...roomWithImages,
      khach_san: hotelWithImages,
      loai_phong_khac: otherWithImages,
      ...reviewData,
    };
  },

  getHotelById: async (id, { ngay_nhan, ngay_tra, so_khach = 2 } = {}) => {
    const checkIn = parseDate(ngay_nhan);
    const checkOut = parseDate(ngay_tra);
    const guests = Math.max(Number(so_khach) || 0, 0);

    const hotel = await prisma.khach_san.findFirst({
      where: { ma_khach_san: Number(id), trang_thai: 'hoat_dong' },
      include: {
        dia_diem: true,
        khach_san_tien_nghi: {
          include: { tien_nghi: { select: { ma_tien_nghi: true, ten: true, bieu_tuong: true } } },
        },
        loai_phong: {
          where: { trang_thai: 'hoat_dong' },
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            gia_co_ban: true,
            suc_chua: true,
            so_luong_phong: true,
            so_luong_mo_ban: true,
            dien_tich: true,
            so_giuong: true,
            mo_ta: true,
            trang_thai: true,
            loai_phong_tien_nghi: {
              include: { tien_nghi: { select: { ma_tien_nghi: true, ten: true, bieu_tuong: true } } },
            },
          },
        },
      },
    });

    if (!hotel) return null;

    const availableRooms = await getAvailableRooms(hotel.loai_phong, checkIn, checkOut, guests);
    const roomsWithPrice = await Promise.all(
      availableRooms.map(async (room) => {
        const pricing = await calcStayPrice(room.ma_loai_phong, room.gia_co_ban, checkIn, checkOut);
        return {
          ...room,
          gia_co_ban: Number(room.gia_co_ban),
          gia_hien_thi: pricing.gia_tu_dem,
          tong_gia: pricing.tong_luong_tru,
          so_dem: pricing.so_dem,
          tien_nghi: (room.loai_phong_tien_nghi || []).map((t) => t.tien_nghi).filter(Boolean),
        };
      })
    );

    const roomsWithImages = await attachRoomImages(roomsWithPrice);
    const [hotelWithImages] = await attachHotelImages([{
      ma_khach_san: hotel.ma_khach_san,
      ten: hotel.ten,
      dia_chi: hotel.dia_chi,
      mo_ta: hotel.mo_ta,
      so_sao: hotel.so_sao,
      gio_nhan_phong: hotel.gio_nhan_phong,
      gio_tra_phong: hotel.gio_tra_phong,
      dia_diem: hotel.dia_diem,
      tien_nghi: hotel.khach_san_tien_nghi.map((t) => t.tien_nghi).filter(Boolean),
      loai_phong: roomsWithImages,
      gia_tu: roomsWithImages.length
        ? Math.min(...roomsWithImages.map((r) => r.gia_hien_thi))
        : null,
    }]);

    const reviewMap = await getHotelReviewStatsMap([hotel.ma_khach_san]);

    return {
      ...hotelWithImages,
      so_danh_gia: reviewMap[hotel.ma_khach_san]?.so_danh_gia || 0,
      diem_trung_binh: reviewMap[hotel.ma_khach_san]?.diem_trung_binh || 0,
    };
  },
};

module.exports = publicHotelService;
