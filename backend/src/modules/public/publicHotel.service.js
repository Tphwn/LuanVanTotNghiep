const prisma = require('../../config/prisma');

const ACTIVE_BOOKING = ['cho_xac_nhan', 'da_xac_nhan'];

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

const parseDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return Number.isNaN(d.getTime()) ? null : d;
};

const countOverlappingBookings = async (maLoaiPhong, checkIn, checkOut) => {
  return prisma.dat_phong.count({
    where: {
      ma_loai_phong: maLoaiPhong,
      trang_thai: { in: ACTIVE_BOOKING },
      ngay_nhan_phong: { lt: checkOut },
      ngay_tra_phong: { gt: checkIn },
    },
  });
};

const getDatesInRange = (checkIn, checkOut) => {
  const dates = [];
  const cur = new Date(checkIn);
  const end = new Date(checkOut);
  while (cur < end) {
    dates.push(new Date(cur).toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
};

const calcStayPrice = async (maLoaiPhong, giaCoBan, checkIn, checkOut) => {
  const base = Number(giaCoBan);
  if (!checkIn || !checkOut) {
    return { gia_tu_dem: base, tong_luong_tru: base, so_dem: 1 };
  }

  const dates = getDatesInRange(checkIn, checkOut);
  if (!dates.length) {
    return { gia_tu_dem: base, tong_luong_tru: base, so_dem: 1 };
  }

  const customPrices = await prisma.bang_gia_phong.findMany({
    where: {
      ma_loai_phong: maLoaiPhong,
      ngay: { gte: checkIn, lt: checkOut },
    },
  });

  const priceMap = customPrices.reduce((acc, row) => {
    acc[row.ngay.toISOString().slice(0, 10)] = Number(row.don_gia);
    return acc;
  }, {});

  let total = 0;
  for (const date of dates) {
    total += priceMap[date] ?? base;
  }

  return {
    gia_tu_dem: Math.round(total / dates.length),
    tong_luong_tru: total,
    so_dem: dates.length,
  };
};

const attachRoomImages = async (rooms) => {
  const ids = rooms.map((r) => r.ma_loai_phong);
  if (!ids.length) return rooms.map((r) => ({ ...r, hinh_anh: [] }));

  const images = await prisma.hinh_anh.findMany({
    where: { loai_doi_tuong: 'loai_phong', ma_doi_tuong: { in: ids } },
    orderBy: { thu_tu: 'asc' },
  });

  const byRoom = images.reduce((acc, img) => {
    if (!acc[img.ma_doi_tuong]) acc[img.ma_doi_tuong] = [];
    acc[img.ma_doi_tuong].push(img);
    return acc;
  }, {});

  return rooms.map((r) => ({ ...r, hinh_anh: byRoom[r.ma_loai_phong] || [] }));
};

const getAvailableRooms = async (rooms, checkIn, checkOut, soKhach) => {
  const eligible = rooms.filter(
    (r) => r.trang_thai === 'hoat_dong' && r.suc_chua >= soKhach && Number(r.so_luong_mo_ban) > 0
  );

  if (!checkIn || !checkOut) {
    return eligible.map((r) => ({ ...r, gia_hien_thi: Number(r.gia_co_ban) }));
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

  searchHotels: async ({ ma_dia_diem, ngay_nhan, ngay_tra, so_khach = 2 }) => {
    return publicHotelService.searchRooms({ ma_dia_diem, ngay_nhan, ngay_tra, so_khach });
  },

  /** Tìm kiếm theo loại phòng (mỗi kết quả = 1 loại phòng khả dụng) */
  searchRooms: async ({ ma_dia_diem, ngay_nhan, ngay_tra, so_khach = 2 }) => {
    const checkIn = parseDate(ngay_nhan);
    const checkOut = parseDate(ngay_tra);
    const guests = Math.max(Number(so_khach) || 0, 0);

    const where = { trang_thai: 'hoat_dong' };
    if (ma_dia_diem) where.ma_dia_diem = Number(ma_dia_diem);

    const hotels = await prisma.khach_san.findMany({
      where,
      include: {
        dia_diem: true,
        khach_san_tien_nghi: {
          include: { tien_nghi: { select: { ten: true, bieu_tuong: true } } },
        },
        loai_phong: {
          where: { trang_thai: 'hoat_dong' },
          select: {
            ma_loai_phong: true,
            ten_loai: true,
            gia_co_ban: true,
            suc_chua: true,
            so_luong_mo_ban: true,
            dien_tich: true,
            so_giuong: true,
            mo_ta: true,
            trang_thai: true,
            loai_phong_tien_nghi: {
              include: { tien_nghi: { select: { ten: true } } },
            },
          },
        },
      },
      orderBy: [{ so_sao: 'desc' }, { ten: 'asc' }],
    });

    const hotelIds = hotels.map((h) => h.ma_khach_san);
    const hotelImages = hotelIds.length
      ? await prisma.hinh_anh.findMany({
        where: { loai_doi_tuong: 'khach_san', ma_doi_tuong: { in: hotelIds } },
        orderBy: { thu_tu: 'asc' },
      })
      : [];
    const imagesByHotel = hotelImages.reduce((acc, img) => {
      if (!acc[img.ma_doi_tuong]) acc[img.ma_doi_tuong] = [];
      acc[img.ma_doi_tuong].push(img);
      return acc;
    }, {});

    const roomResults = [];
    for (const hotel of hotels) {
      const availableRooms = await getAvailableRooms(hotel.loai_phong, checkIn, checkOut, guests);
      const hotelAmenities = hotel.khach_san_tien_nghi.map((t) => t.tien_nghi?.ten).filter(Boolean);

      for (const room of availableRooms) {
        const pricing = await calcStayPrice(room.ma_loai_phong, room.gia_co_ban, checkIn, checkOut);
        const roomAmenities = (room.loai_phong_tien_nghi || [])
          .map((t) => t.tien_nghi?.ten)
          .filter(Boolean);

        roomResults.push({
          ma_loai_phong: room.ma_loai_phong,
          ten_loai: room.ten_loai,
          suc_chua: room.suc_chua,
          dien_tich: room.dien_tich ? Number(room.dien_tich) : null,
          so_giuong: room.so_giuong,
          mo_ta: room.mo_ta,
          phong_con_lai: room.phong_con_lai,
          gia_hien_thi: pricing.gia_tu_dem,
          tong_gia: pricing.tong_luong_tru,
          so_dem: pricing.so_dem,
          tien_nghi: roomAmenities,
          khach_san: {
            ma_khach_san: hotel.ma_khach_san,
            ten: hotel.ten,
            dia_chi: hotel.dia_chi,
            so_sao: hotel.so_sao,
            dia_diem: hotel.dia_diem,
            tien_nghi: hotelAmenities,
            hinh_anh: imagesByHotel[hotel.ma_khach_san] || [],
          },
        });
      }
    }

    return attachRoomImages(roomResults);
  },

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

    const [hotelWithImages] = await attachImages([{
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

    return {
      ...roomWithImages,
      khach_san: hotelWithImages,
      loai_phong_khac: otherWithImages,
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
        };
      })
    );

    const roomsWithImages = await attachRoomImages(roomsWithPrice);
    const [hotelWithImages] = await attachImages([{
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

    return hotelWithImages;
  },
};

module.exports = publicHotelService;
module.exports.parseDate = parseDate;
module.exports.calcStayPrice = calcStayPrice;
module.exports.getDatesInRange = getDatesInRange;
module.exports.countOverlappingBookings = countOverlappingBookings;
