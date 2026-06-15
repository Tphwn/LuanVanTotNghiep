const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { notifyAmenityApproved, notifyAmenityRejected } = require('../../utils/partnerNotify');

const mapRequestRow = (row) => {
  if (!row) return null;
  return {
    ...row,
    doi_tac: row.doi_tac
      ? {
          ten_cong_ty: row.doi_tac.ten_cong_ty,
          email: row.doi_tac.nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung?.email,
          so_dien_thoai: row.doi_tac.nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung?.so_dien_thoai,
        }
      : null,
  };
};

const requestInclude = {
  doi_tac: {
    select: {
      ten_cong_ty: true,
      nguoi_dung_doi_tac_ma_nguoi_dungTonguoi_dung: {
        select: { email: true, so_dien_thoai: true },
      },
    },
  },
  tien_nghi: {
    select: { ten: true, loai: true, bieu_tuong: true },
  },
};

const findRequestById = async (id) => {
  const row = await prisma.yeu_cau_tien_nghi.findUnique({
    where: { ma_yeu_cau: Number(id) },
    include: requestInclude,
  });
  return mapRequestRow(row);
};

const amenityService = {
  findAll: async () => {
    return await prisma.tien_nghi.findMany({ orderBy: { ma_tien_nghi: "desc" } });
  },

  create: async (data) => {
    return await prisma.tien_nghi.create({
      data: {
        ten: data.ten,
        bieu_tuong: data.bieu_tuong,
        loai: data.loai,
        trang_thai: "hoat_dong",
      },
    });
  },

  update: async (id, data) => {
    return await prisma.tien_nghi.update({
      where: { ma_tien_nghi: Number(id) },
      data: {
        ten: data.ten,
        bieu_tuong: data.bieu_tuong,
        loai: data.loai,
      },
    });
  },

  delete: async (id) => {
    return await prisma.tien_nghi.delete({
      where: { ma_tien_nghi: Number(id) },
    });
  },

  getRequests: async () => {
    const rows = await prisma.yeu_cau_tien_nghi.findMany({
      orderBy: { ngay_yeu_cau: 'desc' },
      include: requestInclude,
    });
    return rows.map(mapRequestRow);
  },

  approveRequest: async (id, adminId, options = {}) => {
    const req = await prisma.yeu_cau_tien_nghi.findUnique({
      where: { ma_yeu_cau: Number(id) },
    });
    if (!req) throw new Error('Không tìm thấy yêu cầu');
    if (req.trang_thai !== 'cho_xu_ly') throw new Error('Yêu cầu đã được xử lý');

    const loai = options.loai || req.loai_de_xuat || 'ca_hai';
    const bieu_tuong = options.bieu_tuong || 'wifi';

    const newAmenity = await prisma.tien_nghi.create({
      data: {
        ten: req.ten_de_xuat,
        bieu_tuong,
        loai,
        trang_thai: 'hoat_dong',
      },
    });

    await prisma.yeu_cau_tien_nghi.update({
      where: { ma_yeu_cau: Number(id) },
      data: {
        trang_thai: 'da_tao',
        tien_nghi_tao_id: newAmenity.ma_tien_nghi,
        admin_xu_ly_id: Number(adminId),
        ngay_phan_hoi: new Date(),
      },
    });

    await notifyAmenityApproved(req, loai);

    return findRequestById(id);
  },

  rejectRequest: async (id, adminId, phan_hoi) => {
    const req = await prisma.yeu_cau_tien_nghi.findUnique({
      where: { ma_yeu_cau: Number(id) },
    });
    if (!req) throw new Error('Không tìm thấy yêu cầu');

    await prisma.yeu_cau_tien_nghi.update({
      where: { ma_yeu_cau: Number(id) },
      data: {
        trang_thai: 'tu_choi',
        phan_hoi,
        admin_xu_ly_id: Number(adminId),
        ngay_phan_hoi: new Date(),
      },
    });

    await notifyAmenityRejected(req, phan_hoi);

    return findRequestById(id);
  },
};

module.exports = amenityService;
