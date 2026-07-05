const prisma = require('../../config/prisma');
const { hash, compare } = require('../../utils/hashPassword');
const { generateToken } = require('../../utils/jwt');
const MSG = require('../../constants/messages');

const register = async ({ email, so_dien_thoai, mat_khau, ho_ten }) => {
  console.log('>>> Bắt đầu register:', email); 
  // Kiểm tra email tồn tại
  const emailExists = await prisma.nguoi_dung.findUnique({ where: { email } });
    console.log('>>> emailExists:', emailExists);
  if (emailExists) throw { statusCode: 400, message: MSG.EMAIL_EXISTS };

  // Kiểm tra số điện thoại
  const phoneExists = await prisma.nguoi_dung.findUnique({ where: { so_dien_thoai } });
  if (phoneExists) throw { statusCode: 400, message: MSG.PHONE_EXISTS };

  const matKhauHash = await hash(mat_khau);

  // Tạo nguoi_dung với vai_tro mặc định là khach_hang
  const nguoiDung = await prisma.nguoi_dung.create({
    data: {
      email,
      so_dien_thoai,
      mat_khau: matKhauHash,
      vai_tro: 'khach_hang',
    },
  });

  // Tạo hồ sơ khach_hang tương ứng
  await prisma.khach_hang.create({
    data: {
      ma_nguoi_dung: nguoiDung.ma_nguoi_dung,
      ho_ten,
    },
  });

  const token = generateToken({
    id: nguoiDung.ma_nguoi_dung,
    vai_tro: nguoiDung.vai_tro,
  });

return {
  token,
  user: {
    id: nguoiDung.ma_nguoi_dung,
    email: nguoiDung.email,
    vai_tro: nguoiDung.vai_tro,
    so_dien_thoai: nguoiDung.so_dien_thoai,
    ho_ten,
  },
};
};

const login = async ({ email, mat_khau }) => {
  const nguoiDung = await prisma.nguoi_dung.findUnique({
    where: { email },
    include: { khach_hang: true },
  });

  if (!nguoiDung) throw { statusCode: 401, message: MSG.INVALID_CREDENTIALS };
  if (nguoiDung.trang_thai === 'bi_khoa') throw { statusCode: 403, message: MSG.ACCOUNT_LOCKED };

  const isMatch = await compare(mat_khau, nguoiDung.mat_khau);
  if (!isMatch) throw { statusCode: 401, message: MSG.INVALID_CREDENTIALS };

  // Cập nhật thời gian đăng nhập cuối
  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: nguoiDung.ma_nguoi_dung },
    data: { dang_nhap_cuoi: new Date() },
  });

  const token = generateToken({
    id: nguoiDung.ma_nguoi_dung,
    vai_tro: nguoiDung.vai_tro,
  });

  return {
    token,
    user: {
      id: nguoiDung.ma_nguoi_dung,
      email: nguoiDung.email,
      vai_tro: nguoiDung.vai_tro,
      so_dien_thoai: nguoiDung.so_dien_thoai,
      ho_ten: nguoiDung.khach_hang?.ho_ten || null,
    },
  };
};

const getMe = async (userId) => {
  const nguoiDung = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: userId },
    select: {
      ma_nguoi_dung: true,
      email: true,
      so_dien_thoai: true,
      vai_tro: true,
      trang_thai: true,
      ngay_tao: true,
      dang_nhap_cuoi: true,
      khach_hang: {
        select: { ho_ten: true, anh_dai_dien: true, ngay_sinh: true, gioi_tinh: true }
      },
    },
  });
  if (!nguoiDung) throw { statusCode: 404, message: MSG.NOT_FOUND };
  return nguoiDung;
};

module.exports = { register, login, getMe };