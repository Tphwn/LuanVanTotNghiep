const prisma = require('../../config/prisma');
const {
  countActiveBookedRoomsMap,
  calcRoomAvailability,
  PENDING_CHECKIN_STATUS,
} = require('../../utils/bookingHelpers');
const financeService = require('../finance/finance.service');

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

const endOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
};

const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const partnerBookingWhere = (doiTacId) => ({
  loai_phong: { khach_san: { ma_doi_tac: doiTacId } },
});

const getDashboard = async (doiTacId) => {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();
  const checkInWindowEnd = endOfDay(addDays(todayStart, 1));
  const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);
  const promoSoonEnd = endOfDay(addDays(todayStart, 7));

  const [
    tongKhachSan,
    roomTypes,
    bookingsToday,
    avgReview,
    choXacNhan,
    sapCheckIn,
    sapCheckOut,
    reviewsChuaPhanHoi,
    promotionsSoon,
    financeOverview,
  ] = await Promise.all([
    prisma.khach_san.count({ where: { ma_doi_tac: doiTacId } }),
    prisma.loai_phong.findMany({
      where: { khach_san: { ma_doi_tac: doiTacId }, trang_thai: 'hoat_dong' },
      select: {
        ma_loai_phong: true,
        ten_loai: true,
        so_luong_phong: true,
        so_luong_mo_ban: true,
        khach_san: { select: { ten: true } },
      },
    }),
    prisma.dat_phong.count({
      where: {
        ...partnerBookingWhere(doiTacId),
        ngay_dat: { gte: todayStart, lte: todayEnd },
        trang_thai: { notIn: ['da_huy', 'tu_choi'] },
      },
    }),
    prisma.danh_gia.aggregate({
      where: {
        trang_thai: 'hien_thi',
        dat_phong: { loai_phong: { khach_san: { ma_doi_tac: doiTacId } } },
      },
      _avg: { so_sao: true },
      _count: { _all: true },
    }),
    prisma.dat_phong.count({
      where: {
        ...partnerBookingWhere(doiTacId),
        trang_thai: 'cho_xac_nhan',
      },
    }),
    prisma.dat_phong.count({
      where: {
        ...partnerBookingWhere(doiTacId),
        trang_thai: { in: PENDING_CHECKIN_STATUS },
        ngay_nhan_phong: { gte: todayStart, lte: checkInWindowEnd },
      },
    }),
    prisma.dat_phong.count({
      where: {
        ...partnerBookingWhere(doiTacId),
        trang_thai: 'da_checkin',
        ngay_tra_phong: { gte: todayStart, lte: todayEnd },
      },
    }),
    prisma.danh_gia.count({
      where: {
        trang_thai: { in: ['hien_thi', 'an'] },
        phan_hoi_doi_tac: null,
        dat_phong: { loai_phong: { khach_san: { ma_doi_tac: doiTacId } } },
      },
    }),
    prisma.khuyen_mai.count({
      where: {
        trang_thai: 'hoat_dong',
        ngay_ket_thuc: { gte: todayStart, lte: promoSoonEnd },
        khach_san: { ma_doi_tac: doiTacId },
      },
    }),
    financeService.getOverview(doiTacId, {
      tu_ngay: monthStart.toISOString().slice(0, 10),
      den_ngay: todayEnd.toISOString().slice(0, 10),
    }),
  ]);

  const bookedMap = await countActiveBookedRoomsMap(
    roomTypes.map((r) => r.ma_loai_phong)
  );

  let phongTrongHomNay = 0;
  let tongMoBan = 0;
  let phongSapHet = 0;

  roomTypes.forEach((room) => {
    const daDat = bookedMap.get(room.ma_loai_phong) || 0;
    const { phong_con_lai: conLai } = calcRoomAvailability(room, daDat);
    const moBan = Number(room.so_luong_mo_ban) || 0;
    tongMoBan += moBan;
    phongTrongHomNay += conLai;
    if (moBan > 0 && conLai <= 2 && (daDat > 0 || moBan > 2)) {
      phongSapHet += 1;
    }
  });

  const tyLeLapDay =
    tongMoBan > 0
      ? Number((((tongMoBan - phongTrongHomNay) / tongMoBan) * 100).toFixed(1))
      : 0;

  const doanhThuThang = Number(financeOverview?.cards?.tong_doanh_thu) || 0;
  const choThanhToan = Number(financeOverview?.cards?.cho_thanh_toan) || 0;
  const diemTb =
    avgReview._avg?.so_sao != null
      ? Number(Number(avgReview._avg.so_sao).toFixed(1))
      : 0;

  return {
    kpis: {
      tong_khach_san: tongKhachSan,
      phong_trong_hom_nay: phongTrongHomNay,
      ty_le_lap_day: tyLeLapDay,
      dat_phong_moi: bookingsToday,
      doanh_thu_thang: doanhThuThang,
      diem_danh_gia_tb: diemTb,
      cho_thanh_toan: choThanhToan,
    },
    viec_can_xu_ly: {
      van_hanh: {
        don_sap_check_in: sapCheckIn,
        don_sap_check_out: sapCheckOut,
        booking_cho_xac_nhan: choXacNhan,
      },
      cham_soc: {
        danh_gia_chua_phan_hoi: reviewsChuaPhanHoi,
      },
      doanh_thu: {
        phong_sap_het: phongSapHet,
        khuyen_mai_sap_het: promotionsSoon,
      },
    },
  };
};

module.exports = {
  getDashboard,
  getDoiTacId: financeService.getDoiTacId,
};
