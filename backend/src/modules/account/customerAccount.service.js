const prisma = require('../../config/prisma');
const { hash, compare } = require('../../utils/hashPassword');

const getCustomerProfile = async (userId) => {
  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: parseInt(userId, 10) },
    include: { khach_hang: true },
  });

  if (!user || user.vai_tro !== 'khach_hang') {
    throw new Error('Không tìm thấy tài khoản khách hàng');
  }

  if (!user.khach_hang) {
    throw new Error('Không tìm thấy hồ sơ khách hàng');
  }

  const kh = user.khach_hang;

  return {
    ma_nguoi_dung: user.ma_nguoi_dung,
    ma_khach_hang: kh.ma_khach_hang,
    email: user.email,
    email_dang_ky: user.email,
    so_dien_thoai: user.so_dien_thoai,
    ho_ten: kh.ho_ten,
    anh_dai_dien: kh.anh_dai_dien,
    ngay_sinh: kh.ngay_sinh,
    gioi_tinh: kh.gioi_tinh,
    ngay_tao: user.ngay_tao,
    dang_nhap_cuoi: user.dang_nhap_cuoi,
  };
};

const updateProfile = async (userId, data, avatarUrl) => {
  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: parseInt(userId, 10) },
    include: { khach_hang: true },
  });

  if (!user?.khach_hang) {
    throw new Error('Không tìm thấy hồ sơ khách hàng');
  }

  const { ho_ten, so_dien_thoai } = data;

  if (so_dien_thoai && so_dien_thoai !== user.so_dien_thoai) {
    const phoneExists = await prisma.nguoi_dung.findFirst({
      where: {
        so_dien_thoai,
        NOT: { ma_nguoi_dung: user.ma_nguoi_dung },
      },
    });
    if (phoneExists) throw new Error('Số điện thoại đã được sử dụng');
  }

  const customerUpdate = {};
  if (ho_ten !== undefined) customerUpdate.ho_ten = ho_ten.trim();
  if (avatarUrl) customerUpdate.anh_dai_dien = avatarUrl;

  await prisma.$transaction(async (tx) => {
    if (so_dien_thoai !== undefined) {
      await tx.nguoi_dung.update({
        where: { ma_nguoi_dung: user.ma_nguoi_dung },
        data: { so_dien_thoai: so_dien_thoai.trim() },
      });
    }

    if (Object.keys(customerUpdate).length > 0) {
      await tx.khach_hang.update({
        where: { ma_khach_hang: user.khach_hang.ma_khach_hang },
        data: customerUpdate,
      });
    }
  });

  return getCustomerProfile(userId);
};

const changePassword = async (userId, { mat_khau_cu, mat_khau_moi }) => {
  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: parseInt(userId, 10) },
  });

  if (!user) throw new Error('Không tìm thấy tài khoản');

  const isMatch = await compare(mat_khau_cu, user.mat_khau);
  if (!isMatch) throw new Error('Mật khẩu hiện tại không đúng');

  if (!mat_khau_moi || mat_khau_moi.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự');
  }

  const matKhauHash = await hash(mat_khau_moi);
  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: user.ma_nguoi_dung },
    data: { mat_khau: matKhauHash },
  });

  return { message: 'Đổi mật khẩu thành công' };
};

const changePhone = async (userId, so_dien_thoai) => {
  if (!so_dien_thoai?.trim()) throw new Error('Số điện thoại không được để trống');

  const phone = so_dien_thoai.trim();
  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: parseInt(userId, 10) },
    include: { khach_hang: true },
  });

  if (!user?.khach_hang) {
    throw new Error('Không tìm thấy hồ sơ khách hàng');
  }

  const phoneExists = await prisma.nguoi_dung.findFirst({
    where: {
      so_dien_thoai: phone,
      NOT: { ma_nguoi_dung: user.ma_nguoi_dung },
    },
  });
  if (phoneExists) throw new Error('Số điện thoại đã được sử dụng');

  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: user.ma_nguoi_dung },
    data: { so_dien_thoai: phone },
  });

  return getCustomerProfile(userId);
};

module.exports = {
  getCustomerProfile,
  updateProfile,
  changePassword,
  changePhone,
};
