const prisma = require('../../config/prisma');

const REVENUE_BOOKING_STATUS = [
  'cho_xac_nhan',
  'da_xac_nhan',
  'da_checkin',
  'hoan_thanh',
  'da_huy',
];

const getDoiTacId = async (userId) => {
  const dt = await prisma.doi_tac.findUnique({ where: { ma_nguoi_dung: userId } });
  return dt?.ma_doi_tac;
};

const calcBookingFinance = (booking) => {
  const gross = Number(booking.thanh_toan_cuoi) || 0;
  const commission = booking.hoa_hong ? Number(booking.hoa_hong.so_tien_hoa_hong) : 0;
  const refund = booking.hoan_tien ? Number(booking.hoan_tien.so_tien_hoan) : 0;
  const net = gross - commission - refund;

  return { gross, commission, refund, net };
};

exports.getFinanceSummary = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });

    const { startDate, endDate, ma_khach_san } = req.query;

    const whereCondition = {
      loai_phong: {
        khach_san: {
          ma_doi_tac: doiTacId,
          ...(ma_khach_san ? { ma_khach_san: Number(ma_khach_san) } : {}),
        },
      },
      trang_thai: { in: REVENUE_BOOKING_STATUS },
      ngay_dat: {
        gte: startDate ? new Date(startDate) : new Date(new Date().setDate(1)),
        lte: endDate ? new Date(endDate) : new Date(),
      },
    };

    const bookings = await prisma.dat_phong.findMany({
      where: whereCondition,
      include: {
        hoa_hong: true,
        hoan_tien: true,
      },
      orderBy: { ngay_dat: 'asc' },
    });

    let totalGross = 0;
    let totalCommission = 0;
    let totalRefund = 0;
    const chartDataMap = {};

    bookings.forEach((booking) => {
      const { gross, commission, refund, net } = calcBookingFinance(booking);

      totalGross += gross;
      totalCommission += commission;
      totalRefund += refund;

      const dateKey = new Date(booking.ngay_dat).toISOString().split('T')[0];
      if (!chartDataMap[dateKey]) {
        chartDataMap[dateKey] = { date: dateKey, doanh_thu: 0, thuc_nhan: 0 };
      }
      chartDataMap[dateKey].doanh_thu += gross;
      chartDataMap[dateKey].thuc_nhan += net;
    });

    res.json({
      success: true,
      data: {
        summary: {
          gross: totalGross,
          commission: totalCommission,
          refund: totalRefund,
          net: totalGross - totalCommission - totalRefund,
        },
        chartData: Object.values(chartDataMap),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
