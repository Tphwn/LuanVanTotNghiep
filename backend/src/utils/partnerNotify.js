const prisma = require('../config/prisma');

const LOAI_LABEL = {
  khach_san: 'khách sạn',
  phong: 'loại phòng',
  ca_hai: 'khách sạn & loại phòng',
};

const getPartnerUserId = async (maDoiTac) => {
  const doiTac = await prisma.doi_tac.findUnique({
    where: { ma_doi_tac: Number(maDoiTac) },
    select: { ma_nguoi_dung: true },
  });
  return doiTac?.ma_nguoi_dung;
};

const notifyPartner = async (maDoiTac, { tieu_de, noi_dung, loai = 'tien_nghi' }) => {
  const userId = await getPartnerUserId(maDoiTac);
  if (!userId) return null;

  return prisma.thong_bao.create({
    data: {
      ma_nguoi_dung: userId,
      tieu_de,
      noi_dung,
      loai,
    },
  });
};

const broadcastToPartners = async ({ notifyScope = 'none', maDoiTac = null, payload }) => {
  if (notifyScope === 'one' && maDoiTac) {
    return notifyPartner(maDoiTac, payload);
  }

  if (notifyScope === 'all') {
    const partners = await prisma.doi_tac.findMany({
      where: { trang_thai: 'hoat_dong' },
      select: { ma_doi_tac: true },
    });
    const results = [];
    for (const p of partners) {
      // eslint-disable-next-line no-await-in-loop
      const row = await notifyPartner(p.ma_doi_tac, payload);
      if (row) results.push(row);
    }
    return results;
  }

  return null;
};

const notifyAmenityAdded = async ({
  tenTienNghi,
  loai,
  notifyScope = 'none',
  maDoiTac = null,
}) => {
  const phamVi = LOAI_LABEL[loai] || 'hệ thống';
  return broadcastToPartners({
    notifyScope,
    maDoiTac,
    payload: {
      tieu_de: 'Tiện nghi mới đã được thêm',
      noi_dung: `Admin đã thêm tiện nghi "${tenTienNghi}" (${phamVi}) vào danh mục. Bạn có thể gắn vào khách sạn/loại phòng.`,
      loai: 'tien_nghi',
    },
  });
};

const notifyAmenityLocked = async ({
  tenTienNghi,
  lyDo,
  notifyScope = 'none',
  maDoiTac = null,
}) => broadcastToPartners({
  notifyScope,
  maDoiTac,
  payload: {
    tieu_de: 'Tiện nghi đã bị khóa',
    noi_dung: `Admin đã khóa tiện nghi "${tenTienNghi}". Lý do: ${lyDo}. Tiện nghi này tạm thời không thể gắn mới.`,
    loai: 'tien_nghi',
  },
});

const notifyAmenityUnlocked = async ({
  tenTienNghi,
  notifyScope = 'none',
  maDoiTac = null,
}) => broadcastToPartners({
  notifyScope,
  maDoiTac,
  payload: {
    tieu_de: 'Tiện nghi đã được mở khóa',
    noi_dung: `Admin đã mở khóa tiện nghi "${tenTienNghi}". Bạn có thể gắn lại vào khách sạn/loại phòng.`,
    loai: 'tien_nghi',
  },
});

const notifyHotelApproved = async (maDoiTac, { tenKhachSan }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Khách sạn đã được duyệt',
    noi_dung: `Khách sạn "${tenKhachSan}" đã được quản trị viên duyệt và đang hoạt động trên sàn.`,
    loai: 'he_thong',
  });
};

const notifyHotelRejected = async (maDoiTac, { tenKhachSan, lyDo }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Khách sạn bị từ chối',
    noi_dung: `Khách sạn "${tenKhachSan}" không được duyệt.${lyDo ? ` Lý do: ${lyDo}` : ''}`,
    loai: 'he_thong',
  });
};

const notifyHotelLocked = async (maDoiTac, { tenKhachSan, lyDo }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Khách sạn bị khóa bởi quản trị viên',
    noi_dung: `Khách sạn "${tenKhachSan}" đã bị khóa . Lý do: ${lyDo}`,
    loai: 'he_thong',
  });
};

const notifyHotelUnlocked = async (maDoiTac, { tenKhachSan }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Khách sạn đã được mở khóa',
    noi_dung: `Khách sạn "${tenKhachSan}" đã được quản trị viên mở khóa.`,
    loai: 'he_thong',
  });
};

const notifyRoomTypeLocked = async (maDoiTac, { tenLoaiPhong, tenKhachSan, lyDo }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Loại phòng bị ẩn bởi quản trị viên',
    noi_dung: `Loại phòng "${tenLoaiPhong}" tại khách sạn "${tenKhachSan}" đã bị ẩn. Lý do: ${lyDo}`,
    loai: 'he_thong',
  });
};

const notifyRoomTypeUnlocked = async (maDoiTac, { tenLoaiPhong, tenKhachSan }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Loại phòng đã được mở lại',
    noi_dung: `Loại phòng "${tenLoaiPhong}" tại khách sạn "${tenKhachSan}" đã được quản trị viên mở lại.`,
    loai: 'he_thong',
  });
};

const notifyReviewHidden = async (maDoiTac, { maDonHang, tenKhachSan, lyDo }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Đánh giá bị ẩn bởi quản trị viên',
    noi_dung: `Đánh giá đơn #${maDonHang} tại khách sạn "${tenKhachSan}" đã bị ẩn. Lý do: ${lyDo}`,
    loai: 'danh_gia',
  });
};

const notifyReviewUnhidden = async (maDoiTac, { maDonHang, tenKhachSan }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Đánh giá đã được hiện lại',
    noi_dung: `Đánh giá đơn #${maDonHang} tại khách sạn "${tenKhachSan}" đã được quản trị viên hiện lại.`,
    loai: 'danh_gia',
  });
};

const notifyPartnerResponseHidden = async (maDoiTac, { maDonHang, tenKhachSan, lyDo }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Phản hồi đánh giá bị ẩn',
    noi_dung: `Phản hồi của bạn cho đơn #${maDonHang} tại "${tenKhachSan}" đã bị ẩn. Lý do: ${lyDo}`,
    loai: 'danh_gia',
  });
};

const notifyPartnerResponseUnhidden = async (maDoiTac, { maDonHang, tenKhachSan }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Phản hồi đánh giá đã được hiện lại',
    noi_dung: `Phản hồi của bạn cho đơn #${maDonHang} tại "${tenKhachSan}" đã được quản trị viên hiện lại.`,
    loai: 'danh_gia',
  });
};

const notifyPromotionApproved = async (maDoiTac, { tenKhuyenMai, maCode }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Khuyến mãi đã được duyệt',
    noi_dung: `Khuyến mãi "${tenKhuyenMai}" (mã ${maCode}) đã được quản trị viên duyệt và bắt đầu áp dụng.`,
    loai: 'khuyen_mai',
  });
};

const notifyPromotionRejected = async (maDoiTac, { tenKhuyenMai, maCode, lyDo }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Khuyến mãi bị từ chối',
    noi_dung: `Khuyến mãi "${tenKhuyenMai}" (mã ${maCode}) không được duyệt.${lyDo ? ` Lý do: ${lyDo}` : ''}`,
    loai: 'khuyen_mai',
  });
};

const notifyPromotionLocked = async (maDoiTac, { tenKhuyenMai, maCode, lyDo }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Khuyến mãi bị tạm ngưng',
    noi_dung: `Khuyến mãi "${tenKhuyenMai}" (mã ${maCode}) đã bị quản trị viên tạm ngưng.${lyDo ? ` Lý do: ${lyDo}` : ''}`,
    loai: 'khuyen_mai',
  });
};

const notifyPromotionUnlocked = async (maDoiTac, { tenKhuyenMai, maCode }) => {
  return notifyPartner(maDoiTac, {
    tieu_de: 'Khuyến mãi đã được khôi phục',
    noi_dung: `Khuyến mãi "${tenKhuyenMai}" (mã ${maCode}) đã được quản trị viên khôi phục và tiếp tục áp dụng.`,
    loai: 'khuyen_mai',
  });
};

/** Khách đặt phòng thành công (đã thanh toán / trả tại KS) */
const notifyNewBooking = async (maDoiTac, {
  maDonHang,
  maDatPhong,
  tenKhachSan,
  tenLoaiPhong,
  tenNguoiNhan,
  ngayNhan,
  ngayTra,
  soTien,
}) => {
  const amount = Number(soTien) || 0;
  const amountLabel = new Intl.NumberFormat('vi-VN').format(amount);
  const fmtDate = (d) => {
    const x = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(x.getTime())) return '—';
    const dd = String(x.getDate()).padStart(2, '0');
    const mm = String(x.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}/${x.getFullYear()}`;
  };

  return notifyPartner(maDoiTac, {
    tieu_de: 'Có đơn đặt phòng mới',
    noi_dung: [
      `Đơn #${maDonHang || maDatPhong} tại "${tenKhachSan || '—'}"`,
      `(${tenLoaiPhong || 'phòng'})`,
      `— ${tenNguoiNhan || 'Khách'}`,
      `nhận ${fmtDate(ngayNhan)} · trả ${fmtDate(ngayTra)}.`,
      amount > 0 ? `Giá trị ${amountLabel} ₫.` : null,
      'Vào Quản lý đặt phòng để xem chi tiết.',
    ].filter(Boolean).join(' '),
    loai: 'dat_phong',
  });
};

/** Khách hoặc admin hủy đơn */
const notifyBookingCancelled = async (maDoiTac, {
  maDonHang,
  maDatPhong,
  tenKhachSan,
  lyDo,
  cancelledBy = 'khach',
}) => {
  const byLabel = cancelledBy === 'admin' ? 'quản trị viên' : 'khách hàng';
  return notifyPartner(maDoiTac, {
    tieu_de: 'Đơn đặt phòng đã bị hủy',
    noi_dung: [
      `Đơn #${maDonHang || maDatPhong} tại "${tenKhachSan || '—'}"`,
      `đã bị ${byLabel} hủy.`,
      lyDo ? `Lý do: ${lyDo}.` : null,
      'Vào Quản lý đặt phòng → Đã hủy để xem.',
    ].filter(Boolean).join(' '),
    loai: 'dat_phong',
  });
};

/** Khách gửi đánh giá / phản hồi sau lưu trú */
const notifyNewReview = async (maDoiTac, {
  maDonHang,
  maDatPhong,
  tenKhachSan,
  tenKhachHang,
  soSao,
  noiDung,
}) => {
  const stars = Number(soSao) || 0;
  const excerpt = noiDung
    ? (String(noiDung).trim().length > 120
      ? `${String(noiDung).trim().slice(0, 120)}…`
      : String(noiDung).trim())
    : null;

  return notifyPartner(maDoiTac, {
    tieu_de: 'Khách hàng gửi đánh giá mới',
    noi_dung: [
      `${tenKhachHang || 'Khách'} đã đánh giá ${stars}/5`,
      `đơn #${maDonHang || maDatPhong} tại "${tenKhachSan || '—'}".`,
      excerpt ? `Nội dung: "${excerpt}"` : null,
      'Vào Quản lý đánh giá để xem và phản hồi.',
    ].filter(Boolean).join(' '),
    loai: 'danh_gia',
  });
};

module.exports = {
  notifyPartner,
  notifyAmenityAdded,
  notifyAmenityLocked,
  notifyAmenityUnlocked,
  notifyHotelApproved,
  notifyHotelRejected,
  notifyHotelLocked,
  notifyHotelUnlocked,
  notifyRoomTypeLocked,
  notifyRoomTypeUnlocked,
  notifyReviewHidden,
  notifyReviewUnhidden,
  notifyPartnerResponseHidden,
  notifyPartnerResponseUnhidden,
  notifyPromotionApproved,
  notifyPromotionRejected,
  notifyPromotionLocked,
  notifyPromotionUnlocked,
  notifyNewBooking,
  notifyBookingCancelled,
  notifyNewReview,
};
