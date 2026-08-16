const prisma = require('../../config/prisma');
const { hash, compare } = require('../../utils/hashPassword');
const {
  MSG,
  validatePassword,
  validatePhone,
} = require('../../utils/authValidation');
const {
  validateBankAccount,
  mapBankAccount,
} = require('../../utils/bankAccountHelpers');
const { getVietQrBanks, findBankByCodeOrBin } = require('../../utils/vietQrBanks');

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
    vai_tro: user.vai_tro,
    trang_thai_tai_khoan: user.trang_thai,
    ngay_tao: user.ngay_tao,
    dang_nhap_cuoi: user.dang_nhap_cuoi,
    ten_hien_thi: partner.ten_cong_ty,
    anh_dai_dien: partner.anh_dai_dien,
    ten_cong_ty: partner.ten_cong_ty,
    ma_so_thue: partner.ma_so_thue,
    dia_chi: partner.dia_chi,
    phan_tram_hoa_hong: partner.phan_tram_hoa_hong != null
      ? Number(partner.phan_tram_hoa_hong)
      : 15,
    trang_thai: partner.trang_thai,
    tai_khoan_ngan_hang: mapBankAccount(partner),
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
  const { ten_hien_thi, so_dien_thoai, dia_chi } = data;

  if (so_dien_thoai !== undefined) {
    const phoneErr = validatePhone(so_dien_thoai);
    if (phoneErr) throw new Error(phoneErr);
  }

  if (so_dien_thoai && so_dien_thoai !== user.so_dien_thoai) {
    const phoneExists = await prisma.nguoi_dung.findFirst({
      where: {
        so_dien_thoai: String(so_dien_thoai).trim(),
        NOT: { ma_nguoi_dung: user.ma_nguoi_dung },
      },
    });
    if (phoneExists) throw new Error(MSG.PHONE_EXISTS);
  }

  const partnerUpdate = {};
  if (ten_hien_thi !== undefined) partnerUpdate.ten_cong_ty = ten_hien_thi.trim();
  if (dia_chi !== undefined) {
    partnerUpdate.dia_chi = dia_chi == null || String(dia_chi).trim() === ''
      ? null
      : String(dia_chi).trim();
  }
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

const updateBankAccount = async (userId, payload = {}) => {
  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: parseInt(userId, 10) },
    include: { doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: true },
  });

  if (!user?.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung) {
    throw new Error('Không tìm thấy hồ sơ đối tác');
  }

  const so_tai_khoan = String(payload.so_tai_khoan || '').trim();
  const ten_chu_tai_khoan = String(payload.ten_chu_tai_khoan || '').trim();
  const ma_ngan_hang = String(payload.ma_ngan_hang || '').trim();

  const validationError = validateBankAccount({
    so_tai_khoan,
    ten_chu_tai_khoan,
    ma_ngan_hang,
  });
  if (validationError) throw new Error(validationError);

  const bank = await findBankByCodeOrBin(ma_ngan_hang);
  if (!bank) {
    throw new Error('Ngân hàng không hợp lệ. Vui lòng chọn lại từ danh sách');
  }

  const partnerId = user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung.ma_doi_tac;
  await prisma.doi_tac.update({
    where: { ma_doi_tac: partnerId },
    data: {
      so_tai_khoan,
      ten_chu_tai_khoan,
      ma_ngan_hang: bank.code || bank.bin,
      ten_ngan_hang: bank.short_name || bank.name,
      logo_ngan_hang: bank.logo || null,
    },
  });

  return getPartnerProfile(userId);
};

const listBanks = async () => getVietQrBanks();

const changePassword = async (userId, { mat_khau_cu, mat_khau_moi }) => {
  const user = await prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: parseInt(userId, 10) },
  });

  if (!user) throw new Error('Không tìm thấy tài khoản');
  if (!user.mat_khau) {
    throw new Error('Tài khoản chưa có mật khẩu. Vui lòng đặt mật khẩu mới qua quên mật khẩu.');
  }

  const isMatch = await compare(mat_khau_cu, user.mat_khau);
  if (!isMatch) throw new Error(MSG.PASSWORD_CURRENT_WRONG);

  const pwdErr = validatePassword(mat_khau_moi);
  if (pwdErr) throw new Error(pwdErr);

  const matKhauHash = await hash(mat_khau_moi);
  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: user.ma_nguoi_dung },
    data: { mat_khau: matKhauHash },
  });

  return { message: 'Đổi mật khẩu thành công' };
};

const changePhone = async (userId, so_dien_thoai) => {
  const phoneErr = validatePhone(so_dien_thoai);
  if (phoneErr) throw new Error(phoneErr);

  const phone = String(so_dien_thoai).trim();
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
  if (phoneExists) throw new Error(MSG.PHONE_EXISTS);

  await prisma.nguoi_dung.update({
    where: { ma_nguoi_dung: user.ma_nguoi_dung },
    data: { so_dien_thoai: phone },
  });

  return getPartnerProfile(userId);
};

module.exports = {
  getPartnerProfile,
  updateProfile,
  updateBankAccount,
  listBanks,
  changePassword,
  changePhone,
};
