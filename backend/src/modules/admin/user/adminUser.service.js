const prisma = require('../../../config/prisma');
const { hash } = require('../../../utils/hashPassword');
const { lockPartnerResources, unlockPartnerResources } = require('../../../utils/partnerLockHelpers');

const getUsers = async () => {
  return prisma.nguoi_dung.findMany({
    select: {
      ma_nguoi_dung: true,
      email: true,
      so_dien_thoai: true,
      vai_tro: true,
      trang_thai: true,
      ngay_tao: true,
      dang_nhap_cuoi: true,

      khach_hang: { select: { ho_ten: true, anh_dai_dien: true } },

      doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: {
        select: { ten_cong_ty: true, anh_dai_dien: true },
      },
    },

    orderBy: [
      { ngay_tao: 'asc' },
      { ma_nguoi_dung: 'asc' },
    ],
  });
};

const getUserById = async (id) => {
  return prisma.nguoi_dung.findUnique({
    where: { ma_nguoi_dung: Number(id) },
    select: {
      ma_nguoi_dung: true,
      email: true,
      so_dien_thoai: true,
      vai_tro: true,
      trang_thai: true,
      ngay_tao: true,
      dang_nhap_cuoi: true,

      // Khách hàng + lịch sử đặt phòng
      khach_hang: {
        select: {
          ho_ten: true,
          anh_dai_dien: true,
          ngay_sinh: true,
          gioi_tinh: true,
          tong_lan_dat: true,
          tong_tien_da_chi: true,
          dat_phong: {
            select: {
              ma_dat_phong: true,
              ma_don_hang: true,
              ngay_nhan_phong: true,
              ngay_tra_phong: true,
              thanh_toan_cuoi: true,
              trang_thai: true,
              ngay_dat: true,
              loai_phong: {
                select: {
                  ten_loai: true,
                  khach_san: { select: { ten: true } },
                },
              },
            },
            orderBy: { ngay_dat: 'desc' },
            take: 20,
          },
        },
      },

      // Đối tác + danh sách khách sạn
      doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: {
        select: {
          ma_doi_tac: true,
          ten_cong_ty: true,
          ma_so_thue: true,
          so_dien_thoai: true,
          email_lien_he: true,
          anh_dai_dien: true,
          dia_chi: true,
          trang_thai: true,
          phan_tram_hoa_hong: true,
          ngay_cap_tai_khoan: true,
          khach_san: {
            select: {
              ma_khach_san: true,
              ten: true,
              dia_chi: true,
              so_sao: true,
              trang_thai: true,
              ngay_tao: true,
            },
          },
        },
      },
    },
  });
};
const lockUser = async (id) => {
  const userId = Number(id);

  return prisma.$transaction(async (tx) => {
    const user = await tx.nguoi_dung.findUnique({
      where: { ma_nguoi_dung: userId },
      include: {
        doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: {
          select: { ma_doi_tac: true },
        },
      },
    });

    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy người dùng' };
    }

    const updatedUser = await tx.nguoi_dung.update({
      where: { ma_nguoi_dung: userId },
      data: { trang_thai: 'bi_khoa' },
    });

    const partner = user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung;
    if (partner) {
      await lockPartnerResources(tx, partner.ma_doi_tac);
    }

    return updatedUser;
  });
};

const unlockUser = async (id) => {
  const userId = Number(id);

  return prisma.$transaction(async (tx) => {
    const user = await tx.nguoi_dung.findUnique({
      where: { ma_nguoi_dung: userId },
      include: {
        doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: {
          select: { ma_doi_tac: true },
        },
      },
    });

    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy người dùng' };
    }

    const updatedUser = await tx.nguoi_dung.update({
      where: { ma_nguoi_dung: userId },
      data: { trang_thai: 'hoat_dong' },
    });

    const partner = user.doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung;
    if (partner) {
      await unlockPartnerResources(tx, partner.ma_doi_tac);
    }

    return updatedUser;
  });
};

const createPartner = async (data, adminId) => {
  const MSG = require('../../../constants/messages');

  const emailExists = await prisma.nguoi_dung.findUnique({ where: { email: data.email } });
  if (emailExists) throw { statusCode: 400, message: MSG.EMAIL_EXISTS };

  const phoneExists = await prisma.nguoi_dung.findUnique({ where: { so_dien_thoai: data.so_dien_thoai } });
  if (phoneExists) throw { statusCode: 400, message: MSG.PHONE_EXISTS };

  const passwordHash = await hash(data.mat_khau);
  const userStatus = data.trang_thai === 'bi_khoa' ? 'bi_khoa' : 'hoat_dong';
  const partnerStatus = userStatus;

  return prisma.$transaction(async (tx) => {
    const user = await tx.nguoi_dung.create({
      data: {
        email: data.email,
        so_dien_thoai: data.so_dien_thoai,
        mat_khau: passwordHash,
        vai_tro: 'doi_tac',
        trang_thai: userStatus,
      },
    });

    const partner = await tx.doi_tac.create({
      data: {
        ma_nguoi_dung: user.ma_nguoi_dung,
        nguoi_cap_id: Number(adminId),
        ten_cong_ty: data.ten_cong_ty,
        ma_so_thue: data.ma_so_thue,
        dia_chi: data.dia_chi,
        so_dien_thoai: data.so_dien_thoai,
        phan_tram_hoa_hong: data.phan_tram_hoa_hong,
        trang_thai: partnerStatus,
        anh_dai_dien: data.anh_dai_dien || null,
      },
    });

    return {
      ma_nguoi_dung: user.ma_nguoi_dung,
      email: user.email,
      so_dien_thoai: user.so_dien_thoai,
      vai_tro: user.vai_tro,
      trang_thai: user.trang_thai,
      ngay_tao: user.ngay_tao,
      doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: {
        ten_cong_ty: partner.ten_cong_ty,
        anh_dai_dien: partner.anh_dai_dien,
      },
    };
  });
};

module.exports = {
  getUsers,
  getUserById,
  lockUser,
  unlockUser,
  createPartner,
};