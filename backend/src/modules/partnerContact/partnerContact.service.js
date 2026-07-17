const prisma = require('../../config/prisma');
const {
  validateEmail,
  validatePhone,
} = require('../../utils/authValidation');

const SCALE_OPTIONS = ['Dưới 10 phòng', '10 - 30 phòng', 'Trên 30 phòng'];

const validatePayload = (data) => {
  const errors = {};
  const hoTen = (data.ho_ten || '').trim();
  const soDienThoai = (data.so_dien_thoai || '').trim();
  const email = (data.email || '').trim();
  const tenCoSo = (data.ten_co_so || '').trim();
  const quyMo = (data.quy_mo || '').trim();
  const tinhThanh = (data.tinh_thanh || '').trim();
  const ghiChu = (data.ghi_chu || '').trim();

  if (!hoTen) {
    errors.ho_ten = 'Họ và tên không được để trống.';
  } else if (hoTen.length < 2) {
    errors.ho_ten = 'Họ và tên tối thiểu 2 ký tự.';
  } else if (hoTen.length > 30) {
    errors.ho_ten = 'Họ và tên tối đa 30 ký tự.';
  }

  const phoneErr = validatePhone(soDienThoai);
  if (phoneErr) errors.so_dien_thoai = phoneErr;

  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  if (!tenCoSo) {
    errors.ten_co_so = 'Tên khách sạn/homestay không được để trống.';
  } else if (tenCoSo.length < 2) {
    errors.ten_co_so = 'Tên cơ sở tối thiểu 2 ký tự.';
  } else if (tenCoSo.length > 150) {
    errors.ten_co_so = 'Tên cơ sở tối đa 150 ký tự.';
  }

  if (!quyMo) {
    errors.quy_mo = 'Vui lòng chọn quy mô số phòng.';
  } else if (!SCALE_OPTIONS.includes(quyMo)) {
    errors.quy_mo = 'Quy mô phòng không hợp lệ.';
  }

  if (!tinhThanh) {
    errors.tinh_thanh = 'Tỉnh / Thành phố không được để trống.';
  } else if (tinhThanh.length > 100) {
    errors.tinh_thanh = 'Tỉnh / Thành phố tối đa 100 ký tự.';
  }

  if (ghiChu.length > 500) {
    errors.ghi_chu = 'Ghi chú tối đa 500 ký tự.';
  }

  if (Object.keys(errors).length) {
    const err = new Error('Gửi yêu cầu không thành công. Vui lòng điền đầy đủ và đúng thông tin.');
    err.status = 400;
    err.errors = errors;
    throw err;
  }

  return {
    ho_ten: hoTen,
    so_dien_thoai: soDienThoai,
    email,
    ten_co_so: tenCoSo,
    quy_mo: quyMo,
    tinh_thanh: tinhThanh,
    ghi_chu: ghiChu || null,
  };
};

const createRequest = async (data) => {
  const payload = validatePayload(data);

  return prisma.yeu_cau_hop_tac.create({
    data: payload,
    select: {
      ma_yeu_cau: true,
      ho_ten: true,
      email: true,
      ten_co_so: true,
      trang_thai: true,
      ngay_yeu_cau: true,
    },
  });
};

const listRequests = async ({ trang_thai, keyword, page = 1, limit = 20 }) => {
  const where = {};

  if (trang_thai && trang_thai !== 'all') {
    where.trang_thai = trang_thai;
  }

  const kw = (keyword || '').trim();
  if (kw) {
    where.OR = [
      { ho_ten: { contains: kw } },
      { so_dien_thoai: { contains: kw } },
      { email: { contains: kw } },
      { ten_co_so: { contains: kw } },
      { tinh_thanh: { contains: kw } },
    ];
  }

  const skip = (Math.max(Number(page), 1) - 1) * Math.min(Number(limit), 100);
  const take = Math.min(Math.max(Number(limit), 1), 100);

  const [items, total] = await Promise.all([
    prisma.yeu_cau_hop_tac.findMany({
      where,
      orderBy: { ngay_yeu_cau: 'desc' },
      skip,
      take,
    }),
    prisma.yeu_cau_hop_tac.count({ where }),
  ]);

  return { items, total, page: Number(page), limit: take };
};

const getRequestStats = async () => {
  const [total, cho_xu_ly, da_lien_he, tu_choi, da_hop_tac] = await Promise.all([
    prisma.yeu_cau_hop_tac.count(),
    prisma.yeu_cau_hop_tac.count({ where: { trang_thai: 'cho_xu_ly' } }),
    prisma.yeu_cau_hop_tac.count({ where: { trang_thai: 'da_lien_he' } }),
    prisma.yeu_cau_hop_tac.count({ where: { trang_thai: 'tu_choi' } }),
    prisma.yeu_cau_hop_tac.count({ where: { trang_thai: 'da_hop_tac' } }),
  ]);

  return { total, cho_xu_ly, da_lien_he, tu_choi, da_hop_tac };
};

const getRequestById = async (id) => {
  const item = await prisma.yeu_cau_hop_tac.findUnique({
    where: { ma_yeu_cau: id },
    include: {
      nguoi_dung: {
        select: { ma_nguoi_dung: true, email: true },
      },
    },
  });
  if (!item) {
    const err = new Error('Không tìm thấy yêu cầu hợp tác');
    err.status = 404;
    throw err;
  }
  return item;
};

const updateStatus = async (id, adminId, { trang_thai, phan_hoi }) => {
  await getRequestById(id);

  const allowed = ['cho_xu_ly', 'da_lien_he', 'tu_choi', 'da_hop_tac'];
  if (!allowed.includes(trang_thai)) {
    const err = new Error('Trạng thái không hợp lệ');
    err.status = 400;
    throw err;
  }

  return prisma.yeu_cau_hop_tac.update({
    where: { ma_yeu_cau: id },
    data: {
      trang_thai,
      phan_hoi: phan_hoi?.trim() || null,
      admin_xu_ly_id: adminId,
      ngay_xu_ly: new Date(),
    },
    include: {
      nguoi_dung: {
        select: { ma_nguoi_dung: true, email: true },
      },
    },
  });
};

module.exports = {
  createRequest,
  listRequests,
  getRequestStats,
  getRequestById,
  updateStatus,
};
