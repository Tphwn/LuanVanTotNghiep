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

const notifyAmenityApproved = async (req) => {
  const phamVi = LOAI_LABEL[req.loai_de_xuat] || 'hệ thống';
  return notifyPartner(req.ma_doi_tac, {
    tieu_de: 'Yêu cầu tiện nghi đã được duyệt',
    noi_dung: `Yêu cầu "${req.ten_de_xuat}" (${phamVi}) đã được admin duyệt. Tiện nghi sẽ được thêm vào danh mục. Bạn có thể chọn được tiện nghi`,
  });
};

const notifyAmenityRejected = async (req, phan_hoi) => {
  return notifyPartner(req.ma_doi_tac, {
    tieu_de: 'Đề xuất tiện nghi bị từ chối',
    noi_dung: `Tiện nghi "${req.ten_de_xuat}" không được duyệt.${phan_hoi ? ` Lý do: ${phan_hoi}` : ''}`,
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

module.exports = {
  notifyPartner,
  notifyAmenityApproved,
  notifyAmenityRejected,
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
};
