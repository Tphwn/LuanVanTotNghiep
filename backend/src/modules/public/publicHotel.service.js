const prisma = require('../../config/prisma');
const { Prisma } = require('@prisma/client');
const { attachHotelImages, attachRoomImages } = require('../../utils/images');
const { activePartnerFilter } = require('../../utils/partnerLockHelpers');
const {
  parseDate,
  calcStayPrice,
  countOverlappingBookings,
} = require('../../utils/bookingHelpers');

const resolveAdults = (soKhach) => Math.max(Number(soKhach) || 1, 1);

const resolveChildren = (treEm) => Math.max(Number(treEm) || 0, 0);

const resolveRoomCount = (soPhong, adults) => {
  const rooms = Math.max(Number(soPhong) || 1, 1);
  return Math.min(rooms, adults);
};

const resolveGuestsPerRoom = (soKhach, treEm, soPhong) => {
  const adults = resolveAdults(soKhach);
  const children = resolveChildren(treEm);
  const rooms = resolveRoomCount(soPhong, adults);
  const totalGuests = adults + children;
  return Math.ceil(totalGuests / rooms);
};

const buildSearchContext = (soKhach, treEm, soPhong = 1) => {
  const adults = resolveAdults(soKhach);
  const children = resolveChildren(treEm);
  const roomCount = resolveRoomCount(soPhong, adults);
  const totalGuests = adults + children;
  const guestsPerRoom = Math.ceil(totalGuests / roomCount);
  return {
    adults,
    children,
    totalGuests,
    guestsPerRoom,
    roomCount,
  };
};

const calcRoomAvailability = async (room, checkIn, checkOut) => {
  if (!checkIn || !checkOut) {
    return {
      gia_hien_thi: Number(room.gia_co_ban),
      phong_con_lai: Number(room.so_luong_mo_ban) || 0,
    };
  }

  const booked = await countOverlappingBookings(room.ma_loai_phong, checkIn, checkOut);
  const conLai = Math.max(0, Number(room.so_luong_mo_ban) - booked);
  return {
    gia_hien_thi: Number(room.gia_co_ban),
    phong_con_lai: conLai,
  };
};

const getRoomsWithAvailability = async (rooms, checkIn, checkOut, searchCtx, { onlyAvailable = false } = {}) => {
  const { guestsPerRoom, roomCount } = searchCtx;

  const eligible = rooms.filter(
    (r) => r.trang_thai === 'hoat_dong' && r.suc_chua >= guestsPerRoom,
  );

  const result = [];
  for (const room of eligible) {
    const availability = await calcRoomAvailability(room, checkIn, checkOut);
    const duPhong = availability.phong_con_lai >= roomCount;
    if (onlyAvailable && !duPhong) continue;
    result.push({ ...room, ...availability, so_phong_dat: roomCount });
  }
  return result;
};

const getAvailableRooms = async (rooms, checkIn, checkOut, soKhach, treEm, soPhong) =>
  getRoomsWithAvailability(
    rooms,
    checkIn,
    checkOut,
    buildSearchContext(soKhach, treEm, soPhong),
    { onlyAvailable: true },
  );

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

const getHotelReviewData = async (hotelId) => {
  const [statsRow] = await prisma.$queryRaw`
    SELECT COUNT(dg.ma_danh_gia) AS so_danh_gia,
           AVG(dg.so_sao) AS diem_trung_binh
    FROM danh_gia dg
    INNER JOIN dat_phong dp ON dp.ma_dat_phong = dg.ma_dat_phong
    INNER JOIN loai_phong lp ON lp.ma_loai_phong = dp.ma_loai_phong
    WHERE lp.ma_khach_san = ${Number(hotelId)}
      AND dg.trang_thai = 'hien_thi'
  `;

  const danh_gia = await prisma.danh_gia.findMany({
    where: {
      trang_thai: 'hien_thi',
      dat_phong: { loai_phong: { ma_khach_san: Number(hotelId) } },
    },
    include: {
      khach_hang: { select: { ho_ten: true, anh_dai_dien: true } },
      dat_phong: {
        select: { loai_phong: { select: { ten_loai: true } } },
      },
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
      phan_hoi_doi_tac: dg.phan_hoi_doi_tac?.trim() ? dg.phan_hoi_doi_tac : null,
      ngay_phan_hoi: dg.ngay_phan_hoi,
      khach_hang: dg.khach_hang,
      ten_loai_phong: dg.dat_phong?.loai_phong?.ten_loai || null,
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
            khach_san: {
              where: {
                trang_thai: 'hoat_dong',
                loai_phong: { some: { trang_thai: 'hoat_dong' } },
                ...activePartnerFilter,
              },
            },
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
  listHotels: async ({ ma_dia_diem } = {}) => {
    const where = {
      trang_thai: 'hoat_dong',
      loai_phong: { some: { trang_thai: 'hoat_dong' } },
      ...activePartnerFilter,
    };
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
          select: { gia_co_ban: true, so_luong_mo_ban: true },
        },
        _count: {
          select: {
            loai_phong: { where: { trang_thai: 'hoat_dong' } },
          },
        },
      },
      orderBy: [{ so_sao: 'desc' }, { ten: 'asc' }],
    });

    const mapped = hotels.map((hotel) => {
      const prices = hotel.loai_phong.map((r) => Number(r.gia_co_ban));
      const soPhongTrong = hotel.loai_phong.reduce(
        (sum, r) => sum + (Number(r.so_luong_mo_ban) || 0),
        0,
      );
      return {
        ma_khach_san: hotel.ma_khach_san,
        ten: hotel.ten,
        dia_chi: hotel.dia_chi,
        mo_ta: hotel.mo_ta,
        so_sao: hotel.so_sao,
        dia_diem: hotel.dia_diem,
        so_loai_phong: hotel._count.loai_phong,
        so_phong_trong: soPhongTrong,
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

  searchHotels: async ({ ma_dia_diem, ngay_nhan, ngay_tra, so_khach = 2, tre_em = 0, so_phong = 1 }) => {
    const checkIn = parseDate(ngay_nhan);
    const checkOut = parseDate(ngay_tra);
    const searchCtx = buildSearchContext(so_khach, tre_em, so_phong);

    if (!checkIn || !checkOut) {
      return publicHotelService.listHotels({ ma_dia_diem });
    }

    const where = {
      trang_thai: 'hoat_dong',
      loai_phong: { some: { trang_thai: 'hoat_dong' } },
      ...activePartnerFilter,
    };
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
      const availableRooms = await getAvailableRooms(
        hotel.loai_phong,
        checkIn,
        checkOut,
        so_khach,
        tre_em,
        so_phong,
      );
      if (!availableRooms.length) continue;

      let giaTu = Infinity;
      let bestPricing = null;

      for (const room of availableRooms) {
        const pricing = await calcStayPrice(room.ma_loai_phong, room.gia_co_ban, checkIn, checkOut);
        if (pricing.gia_tu_dem < giaTu) {
          giaTu = pricing.gia_tu_dem;
          bestPricing = pricing;
        }
      }

      hotelResults.push({
        ma_khach_san: hotel.ma_khach_san,
        ten: hotel.ten,
        dia_chi: hotel.dia_chi,
        mo_ta: hotel.mo_ta,
        so_sao: hotel.so_sao,
        dia_diem: hotel.dia_diem,
        so_loai_phong: hotel._count.loai_phong,
        so_phong_trong: availableRooms.reduce((sum, r) => sum + (r.phong_con_lai || 0), 0),
        gia_tu: giaTu === Infinity ? null : giaTu,
        gia_goc: bestPricing?.co_giam_gia ? bestPricing.gia_goc_dem : null,
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

  getRoomById: async (hotelId, roomId, {
    ngay_nhan, ngay_tra, so_khach = 2, tre_em = 0, so_phong = 1,
  } = {}) => {
    const checkIn = parseDate(ngay_nhan);
    const checkOut = parseDate(ngay_tra);
    const searchCtx = buildSearchContext(so_khach, tre_em, so_phong);

    const hotel = await prisma.khach_san.findFirst({
      where: {
        ma_khach_san: Number(hotelId),
        trang_thai: 'hoat_dong',
        ...activePartnerFilter,
      },
      include: {
        dia_diem: true,
        chinh_sach_huy: {
          where: { trang_thai: 'hoat_dong' },
          orderBy: { so_ngay_truoc: 'desc' },
        },
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

    const roomsWithAvailability = await getRoomsWithAvailability(
      hotel.loai_phong,
      checkIn,
      checkOut,
      searchCtx,
    );
    const target = roomsWithAvailability.find((r) => r.ma_loai_phong === Number(roomId));
    if (!target) return null;

    const pricing = await calcStayPrice(target.ma_loai_phong, target.gia_co_ban, checkIn, checkOut);
    const [roomWithImages] = await attachRoomImages([{
      ...target,
      gia_co_ban: Number(target.gia_co_ban),
      gia_hien_thi: pricing.gia_tu_dem,
      gia_goc: pricing.co_giam_gia ? pricing.gia_goc_dem : null,
      tong_gia: pricing.tong_luong_tru,
      so_dem: pricing.so_dem,
      tien_nghi: (target.loai_phong_tien_nghi || []).map((t) => t.tien_nghi).filter(Boolean),
    }]);

    const otherRooms = await Promise.all(
      roomsWithAvailability
        .filter((r) => r.ma_loai_phong !== Number(roomId) && r.phong_con_lai >= searchCtx.roomCount)
        .map(async (room) => {
          const p = await calcStayPrice(room.ma_loai_phong, room.gia_co_ban, checkIn, checkOut);
          return {
            ...room,
            gia_co_ban: Number(room.gia_co_ban),
            gia_hien_thi: p.gia_tu_dem,
            gia_goc: p.co_giam_gia ? p.gia_goc_dem : null,
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
      giay_to_bat_buoc: hotel.giay_to_bat_buoc,
      cho_phep_hut_thuoc: hotel.cho_phep_hut_thuoc,
      cho_phep_to_chuc_tiec: hotel.cho_phep_to_chuc_tiec,
      cho_phep_thu_cung: hotel.cho_phep_thu_cung,
      phu_thu_thu_cung: hotel.phu_thu_thu_cung != null ? Number(hotel.phu_thu_thu_cung) : null,
      tuoi_toi_da_mien_phi: hotel.tuoi_toi_da_mien_phi,
      phu_thu_tre_em: hotel.phu_thu_tre_em != null ? Number(hotel.phu_thu_tre_em) : null,
      hoan_khi_benh: hotel.hoan_khi_benh,
      hoan_cong_viec_dot_xuat: hotel.hoan_cong_viec_dot_xuat,
      yeu_cau_minh_chung_huy: hotel.yeu_cau_minh_chung_huy,
      mo_ta_chinh_sach_huy: hotel.mo_ta_chinh_sach_huy,
      chinh_sach_huy: hotel.chinh_sach_huy.map((p) => ({
        ma_chinh_sach: p.ma_chinh_sach,
        so_ngay_truoc: p.so_ngay_truoc,
        phan_tram_hoan: Number(p.phan_tram_hoan),
        trang_thai: p.trang_thai,
      })),
    }]);

    return {
      ...roomWithImages,
      khach_san: hotelWithImages,
      loai_phong_khac: otherWithImages,
    };
  },

  getHotelById: async (id, { ngay_nhan, ngay_tra, so_khach = 2, tre_em = 0, so_phong = 1 } = {}) => {
    const checkIn = parseDate(ngay_nhan);
    const checkOut = parseDate(ngay_tra);
    const searchCtx = buildSearchContext(so_khach, tre_em, so_phong);

    const hotel = await prisma.khach_san.findFirst({
      where: {
        ma_khach_san: Number(id),
        trang_thai: 'hoat_dong',
        ...activePartnerFilter,
      },
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

    const roomsWithAvailability = await getRoomsWithAvailability(
      hotel.loai_phong,
      checkIn,
      checkOut,
      searchCtx,
    );
    const roomsWithPrice = await Promise.all(
      roomsWithAvailability.map(async (room) => {
        const pricing = await calcStayPrice(room.ma_loai_phong, room.gia_co_ban, checkIn, checkOut);
        return {
          ...room,
          gia_co_ban: Number(room.gia_co_ban),
          gia_hien_thi: pricing.gia_tu_dem,
          gia_goc: pricing.co_giam_gia ? pricing.gia_goc_dem : null,
          tong_gia: pricing.tong_luong_tru,
          so_dem: pricing.so_dem,
          tien_nghi: (room.loai_phong_tien_nghi || []).map((t) => t.tien_nghi).filter(Boolean),
        };
      })
    );

    const roomsWithImages = await attachRoomImages(roomsWithPrice);
    const sortedRooms = [...roomsWithImages].sort((a, b) => {
      const aAvail = (a.phong_con_lai || 0) >= searchCtx.roomCount ? 1 : 0;
      const bAvail = (b.phong_con_lai || 0) >= searchCtx.roomCount ? 1 : 0;
      if (bAvail !== aAvail) return bAvail - aAvail;
      return (a.gia_hien_thi || 0) - (b.gia_hien_thi || 0);
    });
    const soPhongTrong = sortedRooms.reduce((sum, r) => sum + (r.phong_con_lai || 0), 0);
    const availableForPrice = sortedRooms.filter((r) => (r.phong_con_lai || 0) >= searchCtx.roomCount);
    const pricePool = availableForPrice.length ? availableForPrice : sortedRooms;
    const cheapestRoom = pricePool.reduce((best, room) => (
      !best || (room.gia_hien_thi || 0) < (best.gia_hien_thi || 0) ? room : best
    ), null);

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
      loai_phong: sortedRooms,
      so_phong_trong: soPhongTrong,
      gia_tu: cheapestRoom?.gia_hien_thi ?? null,
      gia_goc: cheapestRoom?.gia_goc ?? null,
    }]);

    const reviewData = await getHotelReviewData(hotel.ma_khach_san);

    return {
      ...hotelWithImages,
      so_danh_gia: reviewData.so_danh_gia,
      diem_trung_binh: reviewData.diem_trung_binh,
      danh_gia: reviewData.danh_gia,
    };
  },
};

module.exports = publicHotelService;
