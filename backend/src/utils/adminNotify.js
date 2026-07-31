const prisma = require('../config/prisma');

const getAdminUserIds = async () => {
  const admins = await prisma.nguoi_dung.findMany({
    where: { vai_tro: 'admin', trang_thai: 'hoat_dong' },
    select: { ma_nguoi_dung: true },
  });
  return admins.map((a) => a.ma_nguoi_dung);
};

const notifyAdmins = async ({ tieu_de, noi_dung, loai = 'he_thong', ma_dat_phong = null }) => {
  const adminIds = await getAdminUserIds();
  if (!adminIds.length) return [];

  const data = adminIds.map((ma_nguoi_dung) => ({
    ma_nguoi_dung,
    tieu_de,
    noi_dung,
    loai,
    ...(ma_dat_phong ? { ma_dat_phong: Number(ma_dat_phong) } : {}),
  }));

  return prisma.$transaction(
    data.map((row) => prisma.thong_bao.create({ data: row })),
  );
};

/** Khách hàng / cơ sở gửi form yêu cầu hợp tác */
const notifyPartnerContactRequest = async ({
  maYeuCau,
  hoTen,
  tenCoSo,
  email,
  soDienThoai,
  tinhThanh,
}) => notifyAdmins({
  tieu_de: 'Yêu cầu hợp tác mới',
  noi_dung: [
    `Có yêu cầu hợp tác mới #${maYeuCau}: "${tenCoSo}" (${tinhThanh || '—'}).`,
    `Liên hệ: ${hoTen || '—'} · ${soDienThoai || '—'} · ${email || '—'}.`,
    'Vào Yêu cầu hợp tác để kiểm tra và cấp tài khoản đối tác.',
  ].join(' '),
  loai: 'he_thong',
});

/** Đối tác tạo / gửi lại khách sạn chờ duyệt lên sàn */
const notifyHotelPendingApproval = async ({
  maKhachSan,
  tenKhachSan,
  tenDoiTac,
  isResubmit = false,
}) => notifyAdmins({
  tieu_de: isResubmit ? 'Khách sạn gửi lại chờ duyệt' : 'Khách sạn mới chờ duyệt',
  noi_dung: [
    `Khách sạn "${tenKhachSan}" (#${maKhachSan}) của đối tác "${tenDoiTac || '—'}"`,
    isResubmit ? 'đã cập nhật và gửi lại để duyệt.' : 'đã hoàn thiện khai báo và chờ duyệt đưa lên sàn.',
    'Vào Quản lý khách sạn → Chờ duyệt để xử lý.',
  ].join(' '),
  loai: 'he_thong',
});

/** Đối tác đề xuất tiện nghi chưa có trong danh mục */
const notifyAmenityProposal = async ({
  tenDeXuat,
  loaiDeXuat,
  moTa,
  tenDoiTac,
}) => {
  const phamVi = {
    khach_san: 'khách sạn',
    phong: 'loại phòng',
    ca_hai: 'khách sạn & loại phòng',
  }[loaiDeXuat] || 'hệ thống';

  return notifyAdmins({
    tieu_de: `Đề xuất tiện nghi mới: ${tenDeXuat}`,
    noi_dung: [
      `Đối tác "${tenDoiTac || '—'}" đề xuất thêm tiện nghi "${tenDeXuat}" (${phamVi}).`,
      moTa ? `Ghi chú: ${moTa}` : null,
      'Vào Quản lý tiện nghi để thêm vào danh mục nếu phù hợp.',
    ].filter(Boolean).join(' '),
    loai: 'tien_nghi',
  });
};

/** Đối tác tạo / gửi lại mã khuyến mãi chờ duyệt */
const notifyPromotionPendingApproval = async ({
  maKhuyenMai,
  maCode,
  ten,
  tenKhachSan,
  tenDoiTac,
  isResubmit = false,
}) => notifyAdmins({
  tieu_de: isResubmit ? 'Khuyến mãi gửi lại chờ duyệt' : 'Khuyến mãi mới chờ duyệt',
  noi_dung: [
    `Mã "${maCode}" — ${ten || 'Khuyến mãi'} (#${maKhuyenMai})`,
    `tại khách sạn "${tenKhachSan || '—'}" (đối tác "${tenDoiTac || '—'}")`,
    isResubmit ? 'đã chỉnh sửa và gửi lại để duyệt.' : 'đang chờ duyệt.',
    'Vào Quản lý khuyến mãi để phê duyệt.',
  ].join(' '),
  loai: 'khuyen_mai',
});

/** Đơn hủy hợp lệ phát sinh yêu cầu hoàn tiền */
const notifyRefundRequest = async ({
  maHoanTien,
  maDatPhong,
  maDonHang,
  soTienHoan,
  lyDo,
}) => {
  const amount = Number(soTienHoan) || 0;
  const amountLabel = new Intl.NumberFormat('vi-VN').format(amount);
  return notifyAdmins({
    tieu_de: 'Yêu cầu hoàn tiền mới',
    noi_dung: [
      `Đơn ${maDonHang ? `#${maDonHang}` : `#${maDatPhong}`} phát sinh hoàn tiền #${maHoanTien}`,
      `số tiền ${amountLabel} ₫.`,
      lyDo ? `Lý do: ${lyDo}.` : null,
      'Vào Tài chính → Hoàn tiền để xử lý.',
    ].filter(Boolean).join(' '),
    loai: 'thanh_toan',
    ma_dat_phong: maDatPhong,
  });
};

module.exports = {
  notifyAdmins,
  notifyPartnerContactRequest,
  notifyHotelPendingApproval,
  notifyAmenityProposal,
  notifyPromotionPendingApproval,
  notifyRefundRequest,
};
