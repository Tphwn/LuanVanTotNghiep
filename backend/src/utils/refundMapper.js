const {
  calcRefundFromPolicy,
  extractCancelReason,
} = require('./refundHelpers');

const formatRefundCode = (id) => `HT-${String(id).padStart(6, '0')}`;

const formatVnd = (amount) =>
  `${new Intl.NumberFormat('vi-VN').format(Number(amount) || 0)}đ`;

const resolvePaymentMethod = (refund) => {
  const tx = refund?.thanh_toan;
  const booking = refund?.dat_phong;
  if (tx?.phuong_thuc) return tx.phuong_thuc;
  if (booking?.phuong_thuc_tt === 'truc_tuyen') return 'Trực tuyến';
  if (booking?.phuong_thuc_tt === 'tai_khach_san') return 'Tại khách sạn';
  return '—';
};

const buildRefundCalc = (refund) => {
  const booking = refund?.dat_phong;
  const policies = booking?.loai_phong?.khach_san?.chinh_sach_huy || [];
  const cancelDate = refund?.ngay_yeu_cau || new Date();
  const total = Number(booking?.thanh_toan_cuoi) || 0;
  const calc = calcRefundFromPolicy(
    policies,
    booking?.ngay_nhan_phong,
    cancelDate,
    total,
  );

  const phanTramHoan = calc.phan_tram_hoan;
  const phanTramPhat = Math.max(0, 100 - phanTramHoan);
  const soTienHoan = Number(refund?.so_tien_hoan) || calc.so_tien_hoan;
  const phiPhat = Math.max(0, total - soTienHoan);

  return {
    tong_don: total,
    phan_tram_hoan: phanTramHoan,
    phan_tram_phat: phanTramPhat,
    so_tien_hoan: soTienHoan,
    phi_phat: phiPhat,
    chi_tiet_tinh_toan:
      `Tổng đơn ${formatVnd(total)} - Phí phạt hủy (${phanTramPhat}%) = Số tiền cần hoàn: ${formatVnd(soTienHoan)}`,
  };
};

const mapRefund = (refund) => {
  if (!refund) return null;

  const booking = refund.dat_phong;
  const hotel = booking?.loai_phong?.khach_san;
  const calc = buildRefundCalc(refund);
  const lyDoHuy = extractCancelReason(booking?.ghi_chu) || refund.ly_do || '—';

  return {
    ...refund,
    ma_hoan: formatRefundCode(refund.ma_hoan_tien),
    ly_do_huy: lyDoHuy,
    phuong_thuc: resolvePaymentMethod(refund),
    khach_hang_ten: booking?.khach_hang?.ho_ten || booking?.ten_nguoi_nhan || null,
    khach_hang_sdt:
      booking?.khach_hang?.nguoi_dung?.so_dien_thoai || booking?.sdt_nguoi_nhan || null,
    ten_khach_san: hotel?.ten || null,
    ten_loai_phong: booking?.loai_phong?.ten_loai || null,
    ten_doi_tac: hotel?.doi_tac?.ten_cong_ty || null,
    ma_don_hang: booking?.ma_don_hang || null,
    ...calc,
  };
};

const mapRefunds = (list = []) => list.map(mapRefund);

module.exports = {
  formatRefundCode,
  mapRefund,
  mapRefunds,
};
