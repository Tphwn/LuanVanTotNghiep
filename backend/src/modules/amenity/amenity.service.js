const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { notifyAmenityAdded } = require('../../utils/partnerNotify');

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

  listPartnersForNotify: async () => {
    return prisma.doi_tac.findMany({
      where: { trang_thai: 'hoat_dong' },
      select: {
        ma_doi_tac: true,
        ten_cong_ty: true,
      },
      orderBy: { ten_cong_ty: 'asc' },
    });
  },

  create: async (data) => {
    const notifyScope = ['all', 'one', 'none'].includes(data.notify_scope)
      ? data.notify_scope
      : 'none';
    const maDoiTac = data.ma_doi_tac != null ? Number(data.ma_doi_tac) : null;

    if (notifyScope === 'one' && (!maDoiTac || Number.isNaN(maDoiTac))) {
      throw new Error('Vui lòng chọn đối tác để thông báo');
    }

    const created = await prisma.tien_nghi.create({
      data: {
        ten: data.ten,
        bieu_tuong: data.bieu_tuong,
        loai: data.loai,
        danh_muc: data.danh_muc || null,
        trang_thai: 'hoat_dong',
      },
    });

    await notifyAmenityAdded({
      tenTienNghi: created.ten,
      loai: created.loai,
      notifyScope,
      maDoiTac,
    });

    return created;
  },

  update: async (id, data) => {
    return prisma.tien_nghi.update({
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
    return prisma.tien_nghi.delete({
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
};

module.exports = amenityService;
