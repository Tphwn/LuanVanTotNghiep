const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { notifyAmenityApproved, notifyAmenityRejected } = require('../../utils/partnerNotify');

const mapRequestRow = (row) => {
  if (!row) return null;
  const firstHotel = row.doi_tac?.khach_san?.[0] || null;
  return {
    ...row,
    doi_tac: row.doi_tac
      ? {
          ten_cong_ty: row.doi_tac.ten_cong_ty,
          ten_khach_san: firstHotel?.ten || null,
          ma_khach_san: firstHotel?.ma_khach_san || null,
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
      khach_san: {
        select: { ma_khach_san: true, ten: true },
        orderBy: { ma_khach_san: 'asc' },
        take: 1,
      },
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

const withUsageFlags = (row) => {
  if (!row) return null;
  const { _count, ...rest } = row;
  const soLanSuDung =
    (_count?.khach_san_tien_nghi || 0) + (_count?.loai_phong_tien_nghi || 0);
  return {
    ...rest,
    dang_su_dung: soLanSuDung > 0,
    so_lan_su_dung: soLanSuDung,
  };
};

const amenityUsageInclude = {
  _count: {
    select: {
      khach_san_tien_nghi: true,
      loai_phong_tien_nghi: true,
    },
  },
};

const amenityService = {
  findAll: async () => {
    const rows = await prisma.tien_nghi.findMany({
      orderBy: { ma_tien_nghi: 'desc' },
      include: amenityUsageInclude,
    });
    return rows.map(withUsageFlags);
  },

  create: async (data) => {
    return await prisma.tien_nghi.create({
      data: {
        ten: data.ten,
        bieu_tuong: data.bieu_tuong,
        loai: data.loai,
        danh_muc: data.danh_muc || null,
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
        danh_muc: data.danh_muc || null,
      },
    });
  },

  delete: async (id) => {
    return await prisma.tien_nghi.delete({
      where: { ma_tien_nghi: Number(id) },
    });
  },

  setStatus: async (id, trang_thai) => {
    if (!['hoat_dong', 'an'].includes(trang_thai)) {
      throw new Error('Trạng thái không hợp lệ');
    }
    const maTienNghi = Number(id);
    const found = await prisma.tien_nghi.findUnique({
      where: { ma_tien_nghi: maTienNghi },
      include: amenityUsageInclude,
    });
    if (!found) throw new Error('Không tìm thấy tiện nghi');

    // Chỉ khóa khi chưa có đối tác nào gắn tiện nghi vào KS / loại phòng
    if (trang_thai === 'an') {
      const soLanSuDung =
        (found._count?.khach_san_tien_nghi || 0)
        + (found._count?.loai_phong_tien_nghi || 0);
      if (soLanSuDung > 0) {
        throw new Error(
          'Không thể khóa tiện nghi này vì đã có đối tác chọn. Chỉ khóa khi chưa có đối tác nào sử dụng.',
        );
      }
    }

    const updated = await prisma.tien_nghi.update({
      where: { ma_tien_nghi: maTienNghi },
      data: { trang_thai },
      include: amenityUsageInclude,
    });
    return withUsageFlags(updated);
  },

  getRequests: async () => {
    const rows = await prisma.yeu_cau_tien_nghi.findMany({
      orderBy: { ngay_yeu_cau: 'desc' },
      include: requestInclude,
    });
    return rows.map(mapRequestRow);
  },

  approveRequest: async (id, adminId) => {
    const req = await prisma.yeu_cau_tien_nghi.findUnique({
      where: { ma_yeu_cau: Number(id) },
    });
    if (!req) throw new Error('Không tìm thấy yêu cầu');
    if (req.trang_thai !== 'cho_xu_ly') throw new Error('Yêu cầu đã được xử lý');

    await prisma.yeu_cau_tien_nghi.update({
      where: { ma_yeu_cau: Number(id) },
      data: {
        trang_thai: 'da_tao',
        tien_nghi_tao_id: null,
        admin_xu_ly_id: Number(adminId),
        ngay_phan_hoi: new Date(),
      },
    });

    await notifyAmenityApproved(req);

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
