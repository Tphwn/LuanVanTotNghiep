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

const notifyPartner = async (maDoiTac, { tieu_de, noi_dung }) => {
  const userId = await getPartnerUserId(maDoiTac);
  if (!userId) return null;

  return prisma.thong_bao.create({
    data: {
      ma_nguoi_dung: userId,
      tieu_de,
      noi_dung,
      loai: 'tien_nghi',
    },
  });
};

const notifyAmenityApproved = async (req, loai) => {
  const phamVi = LOAI_LABEL[loai] || LOAI_LABEL[req.loai_de_xuat] || 'hệ thống';
  return notifyPartner(req.ma_doi_tac, {
    tieu_de: 'Đề xuất tiện nghi đã được duyệt',
    noi_dung: `Tiện nghi "${req.ten_de_xuat}" đã được admin duyệt và thêm vào danh mục ${phamVi}. Bạn có thể chọn tiện nghi này ngay bây giờ.`,
  });
};

const notifyAmenityRejected = async (req, phan_hoi) => {
  return notifyPartner(req.ma_doi_tac, {
    tieu_de: 'Đề xuất tiện nghi bị từ chối',
    noi_dung: `Tiện nghi "${req.ten_de_xuat}" không được duyệt.${phan_hoi ? ` Lý do: ${phan_hoi}` : ''}`,
  });
};

module.exports = {
  notifyPartner,
  notifyAmenityApproved,
  notifyAmenityRejected,
};
