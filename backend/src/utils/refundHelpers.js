const DEFAULT_POLICIES = [
  { so_ngay_truoc: 7, phan_tram_hoan: 100 },
  { so_ngay_truoc: 3, phan_tram_hoan: 50 },
  { so_ngay_truoc: 1, phan_tram_hoan: 0 },
];

const daysBeforeCheckIn = (checkInDate, cancelDate) => {
  const checkIn = new Date(checkInDate);
  const cancel = new Date(cancelDate);
  checkIn.setHours(0, 0, 0, 0);
  cancel.setHours(0, 0, 0, 0);
  return Math.floor((checkIn - cancel) / (1000 * 60 * 60 * 24));
};

const calcRefundFromPolicy = (policies, checkInDate, cancelDate, totalAmount) => {
  const activePolicies = (policies?.length ? policies : DEFAULT_POLICIES)
    .filter((p) => p.trang_thai == null || p.trang_thai === 'hoat_dong')
    .sort((a, b) => b.so_ngay_truoc - a.so_ngay_truoc);

  const days = daysBeforeCheckIn(checkInDate, cancelDate);
  const matched = activePolicies.find((p) => days >= Number(p.so_ngay_truoc));
  const phanTram = matched ? Number(matched.phan_tram_hoan) : 0;
  const total = Number(totalAmount) || 0;
  const soTien = Math.round((total * phanTram) / 100);

  return {
    phan_tram_hoan: phanTram,
    so_tien_hoan: soTien,
    so_ngay_truoc_ap_dung: matched?.so_ngay_truoc ?? null,
    so_ngay_con_lai: days,
  };
};

const extractCancelReason = (ghiChu) => {
  if (!ghiChu?.trim()) return 'Không rõ';
  const adminMatch = ghiChu.match(/^\[Admin hủy\]\s*(.+)$/i);
  if (adminMatch) return adminMatch[1].trim();
  return ghiChu.trim();
};

const wasBookingPaid = (booking) =>
  booking?.phuong_thuc_tt === 'truc_tuyen'
  || booking?.thanh_toan?.trang_thai === 'thanh_cong';

const getRefundStatusLabel = (refundStatus) => {
  if (refundStatus === 'da_hoan') return 'Đã hoàn';
  if (refundStatus === 'cho_xu_ly' || refundStatus === 'dang_xu_ly') return 'Chờ xử lý';
  if (refundStatus === 'tu_choi') return 'Từ chối';
  return null;
};

const buildRefundStatusMessage = (refundStatus) => {
  if (refundStatus === 'da_hoan') return 'Admin đã hoàn tiền cho khách.';
  if (refundStatus === 'cho_xu_ly' || refundStatus === 'dang_xu_ly') {
    return 'Yêu cầu hoàn tiền đang chờ xử lý.';
  }
  if (refundStatus === 'tu_choi') return 'Yêu cầu hoàn tiền đã bị từ chối.';
  return null;
};

const buildPartnerRefundInfo = (booking) => {
  if (!['da_huy', 'tu_choi'].includes(booking?.trang_thai)) return null;

  const policies = booking.loai_phong?.khach_san?.chinh_sach_huy || [];
  const cancelDate = booking.hoan_tien?.ngay_yeu_cau || new Date();
  const paid = wasBookingPaid(booking);
  const calc = paid
    ? calcRefundFromPolicy(
      policies,
      booking.ngay_nhan_phong,
      cancelDate,
      booking.thanh_toan_cuoi,
    )
    : { phan_tram_hoan: 0, so_tien_hoan: 0, so_ngay_truoc_ap_dung: null, so_ngay_con_lai: 0 };

  const hoanTien = booking.hoan_tien;
  const soTienHoan = hoanTien ? Number(hoanTien.so_tien_hoan) : calc.so_tien_hoan;
  const phanTram = calc.phan_tram_hoan;
  const trangThaiHoan = hoanTien?.trang_thai || (paid ? 'cho_xu_ly' : null);

  const lyDoHuy = hoanTien?.ly_do || extractCancelReason(booking.ghi_chu);
  const trangThaiMsg = buildRefundStatusMessage(trangThaiHoan);

  let tomTat = null;
  if (paid && soTienHoan > 0) {
    tomTat = `Theo chính sách, khách được hoàn lại ${phanTram}% số tiền (tương đương ${soTienHoan.toLocaleString('vi-VN')}đ).`;
    if (trangThaiMsg) tomTat += ` ${trangThaiMsg}`;
  } else if (paid) {
    tomTat = 'Theo chính sách hủy, khách không được hoàn tiền cho đơn này.';
    if (trangThaiMsg) tomTat += ` ${trangThaiMsg}`;
  } else {
    tomTat = 'Khách chưa thanh toán online nên không phát sinh hoàn tiền.';
  }

  return {
    ly_do_huy: lyDoHuy,
    phan_tram_hoan: phanTram,
    so_tien_hoan: soTienHoan,
    trang_thai_hoan: trangThaiHoan,
    da_thanh_toan_online: paid,
    tom_tat_chinh_sach: tomTat,
    trang_thai_hoan_label: getRefundStatusLabel(trangThaiHoan),
  };
};

const processRefundOnCancel = async (tx, bookingId, lyDo) => {
  const booking = await tx.dat_phong.findUnique({
    where: { ma_dat_phong: Number(bookingId) },
    include: {
      thanh_toan: true,
      hoan_tien: true,
      loai_phong: {
        include: {
          khach_san: {
            include: {
              chinh_sach_huy: {
                where: { trang_thai: 'hoat_dong' },
                orderBy: { so_ngay_truoc: 'desc' },
              },
            },
          },
        },
      },
    },
  });

  if (!booking?.thanh_toan || booking.hoan_tien) return;
  if (!wasBookingPaid(booking)) return;

  const cancelDate = new Date();
  const policies = booking.loai_phong?.khach_san?.chinh_sach_huy || [];
  const { so_tien_hoan: soTienHoan } = calcRefundFromPolicy(
    policies,
    booking.ngay_nhan_phong,
    cancelDate,
    booking.thanh_toan_cuoi,
  );

  await tx.hoan_tien.create({
    data: {
      ma_dat_phong: booking.ma_dat_phong,
      ma_thanh_toan: booking.thanh_toan.ma_thanh_toan,
      so_tien_hoan: soTienHoan,
      ly_do: lyDo || 'Hủy đơn đặt phòng',
      trang_thai: 'cho_xu_ly',
    },
  });
};

module.exports = {
  DEFAULT_POLICIES,
  daysBeforeCheckIn,
  calcRefundFromPolicy,
  extractCancelReason,
  wasBookingPaid,
  getRefundStatusLabel,
  buildPartnerRefundInfo,
  processRefundOnCancel,
};
