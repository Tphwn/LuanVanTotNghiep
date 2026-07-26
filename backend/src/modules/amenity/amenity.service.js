const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  notifyAmenityAdded,
  notifyAmenityLocked,
  notifyAmenityUnlocked,
} = require('../../utils/partnerNotify');

const parseNotifyOptions = (data = {}) => {
  const notifyScope = ['all', 'one', 'none'].includes(data.notify_scope)
    ? data.notify_scope
    : 'none';
  const maDoiTac = data.ma_doi_tac != null ? Number(data.ma_doi_tac) : null;

  if (notifyScope === 'one' && (!maDoiTac || Number.isNaN(maDoiTac))) {
    const err = new Error('Vui lòng chọn đối tác để thông báo');
    err.statusCode = 400;
    throw err;
  }

  return { notifyScope, maDoiTac };
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

/** Trim + viết hoa chữ cái đầu (locale vi) */
const formatAmenityName = (ten) => {
  const trimmed = String(ten || '').trim().replace(/\s+/g, ' ');
  if (!trimmed) {
    const err = new Error('Vui lòng nhập tên tiện nghi');
    err.statusCode = 400;
    throw err;
  }
  return trimmed.charAt(0).toLocaleUpperCase('vi') + trimmed.slice(1);
};

const normalizeNameKey = (ten) => formatAmenityName(ten).toLocaleLowerCase('vi');

const assertUniqueAmenityName = async (ten, excludeId = null) => {
  const key = normalizeNameKey(ten);
  const rows = await prisma.tien_nghi.findMany({
    select: { ma_tien_nghi: true, ten: true },
  });
  const duplicated = rows.find((row) => {
    if (excludeId != null && Number(row.ma_tien_nghi) === Number(excludeId)) return false;
    return String(row.ten || '').trim().toLocaleLowerCase('vi') === key;
  });
  if (duplicated) {
    const err = new Error('Tiện nghi đã có, vui lòng kiểm tra lại');
    err.statusCode = 400;
    throw err;
  }
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
    const { notifyScope, maDoiTac } = parseNotifyOptions(data);

    const ten = formatAmenityName(data.ten);
    await assertUniqueAmenityName(ten);

    const created = await prisma.tien_nghi.create({
      data: {
        ten,
        bieu_tuong: data.bieu_tuong || null,
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
    const ten = formatAmenityName(data.ten);
    await assertUniqueAmenityName(ten, id);

    return prisma.tien_nghi.update({
      where: { ma_tien_nghi: Number(id) },
      data: {
        ten,
        bieu_tuong: data.bieu_tuong || null,
        loai: data.loai,
        danh_muc: data.danh_muc || null,
      },
    });
  },

  setStatus: async (id, trang_thai, options = {}) => {
    if (!['hoat_dong', 'an'].includes(trang_thai)) {
      const err = new Error('Trạng thái không hợp lệ');
      err.statusCode = 400;
      throw err;
    }
    const maTienNghi = Number(id);
    const found = await prisma.tien_nghi.findUnique({
      where: { ma_tien_nghi: maTienNghi },
      include: amenityUsageInclude,
    });
    if (!found) {
      const err = new Error('Không tìm thấy tiện nghi');
      err.statusCode = 404;
      throw err;
    }

    const { notifyScope, maDoiTac } = parseNotifyOptions(options);
    const lyDo = String(options.ly_do || '').trim();

    if (trang_thai === 'an') {
      if (!lyDo) {
        const err = new Error('Vui lòng nhập lý do khóa tiện nghi');
        err.statusCode = 400;
        throw err;
      }
    }

    const updated = await prisma.tien_nghi.update({
      where: { ma_tien_nghi: maTienNghi },
      data: { trang_thai },
      include: amenityUsageInclude,
    });

    if (trang_thai === 'an') {
      await notifyAmenityLocked({
        tenTienNghi: updated.ten,
        lyDo,
        notifyScope,
        maDoiTac,
      });
    } else {
      await notifyAmenityUnlocked({
        tenTienNghi: updated.ten,
        notifyScope,
        maDoiTac,
      });
    }

    return withUsageFlags(updated);
  },
};

module.exports = amenityService;
