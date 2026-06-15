const prisma = require('../../config/prisma');
const { hash, compare } = require('../../utils/hashPassword');

const getPartnerProfile = async (userId) => {
  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: parseInt(userId) },
    include: {
      doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: true,
    },
  });

  if (!user || user.vai_tro !== 'doi_tac') {
    throw new Error('Không tìm thấy tài khoản đối tác');
  }

  const partner = user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung;
  if (!partner) throw new Error('Không tìm thấy hồ sơ đối tác');

  return {
    ma_nguoi_dung: user.ma_nguoi_dung,
    email_dang_ky: user.email,
    so_dien_thoai: user.so_dien_thoai,
    ngay_tao: user.ngay_tao,
    dang_nhap_cuoi: user.dang_nhap_cuoi,
    ten_hien_thi: partner.ten_cong_ty,
    email_lien_he: partner.email_lien_he || user.email,
    anh_dai_dien: partner.anh_dai_dien,
    ten_cong_ty: partner.ten_cong_ty,
    ma_so_thue: partner.ma_so_thue,
    dia_chi: partner.dia_chi,
    trang_thai: partner.trang_thai,
  };
};

const updateProfile = async (userId, data, avatarUrl) => {
  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: parseInt(userId) },
    include: { doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: true },
  });

  if (!user?.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung) {
    throw new Error('Không tìm thấy hồ sơ đối tác');
  }

  const partnerId = user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung.ma_doi_tac;
  const { ten_hien_thi, email_lien_he, so_dien_thoai } = data;

  if (so_dien_thoai && so_dien_thoai !== user.so_dien_thoai) {
    const phoneExists = await prisma.nguoi_dung.findFirst({
      where: {
        so_dien_thoai,
        NOT: { ma_nguoi_dung: user.ma_nguoi_dung },
      },
    });
    if (phoneExists) throw new Error('Số điện thoại đã được sử dụng');
  }

  const partnerUpdate = {};
  if (ten_hien_thi !== undefined) partnerUpdate.ten_cong_ty = ten_hien_thi.trim();
  if (email_lien_he !== undefined) partnerUpdate.email_lien_he = email_lien_he.trim() || null;
  if (so_dien_thoai !== undefined) partnerUpdate.so_dien_thoai = so_dien_thoai.trim();
  if (avatarUrl) partnerUpdate.anh_dai_dien = avatarUrl;

  await prisma.$transaction(async (tx) => {
    if (so_dien_thoai !== undefined) {
      await tx.nguoi_dung.update({
        where: { ma_nguoi_dung: user.ma_nguoi_dung },
        data: { so_dien_thoai: so_dien_thoai.trim() },
      });
    }

    if (Object.keys(partnerUpdate).length > 0) {
      await tx.doi_tac.update({
        where: { ma_doi_tac: partnerId },
        data: partnerUpdate,
      });
    }
  });

  return getPartnerProfile(userId);
};

const changePassword = async (userId, { mat_khau_cu, mat_khau_moi }) => {
  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: parseInt(userId) },
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
    where: { ma_nguoi_dung: parseInt(userId) },
    include: { doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: true },
  });

  if (!user?.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung) {
    throw new Error('Không tìm thấy hồ sơ đối tác');
  }

  const phoneExists = await prisma.nguoi_dung.findFirst({
    where: {
      so_dien_thoai: phone,
      NOT: { ma_nguoi_dung: user.ma_nguoi_dung },
    },
  });
  if (phoneExists) throw new Error('Số điện thoại đã được sử dụng');

  await prisma.$transaction(async (tx) => {
    await tx.nguoi_dung.update({
      where: { ma_nguoi_dung: user.ma_nguoi_dung },
      data: { so_dien_thoai: phone },
    });
    await tx.doi_tac.update({
      where: { ma_doi_tac: user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung.ma_doi_tac },
      data: { so_dien_thoai: phone },
    });
  });

  return getPartnerProfile(userId);
};

module.exports = {
  getPartnerProfile,
  updateProfile,
  changePassword,
  changePhone,
};
