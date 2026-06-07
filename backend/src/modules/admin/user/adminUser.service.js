const prisma = require('../../../config/prisma');
const { hash } = require('../../../utils/hashPassword');

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

      khach_hang: true,

      doi_tac_doi_tac_ma_nguoi_dungTonguoi_dung: true,
    },

    orderBy: {
      ma_nguoi_dung: 'desc',
    },
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
          dia_chi: true,
          trang_thai: true,
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
  return prisma.nguoi_dung.update({
    where: {
      ma_nguoi_dung: Number(id),
    },
    data: {
      trang_thai: 'bi_khoa',
    },
  });
};

const unlockUser = async (id) => {
  return prisma.nguoi_dung.update({
    where: {
      ma_nguoi_dung: Number(id),
    },
    data: {
      trang_thai: 'hoat_dong',
    },
  });
};

const createPartner = async (data, adminId) => {
  const passwordHash = await hash(data.mat_khau);

  return prisma.$transaction(async (tx) => {

    const user = await tx.nguoi_dung.create({
      data: {
        email: data.email,
        so_dien_thoai: data.so_dien_thoai,
        mat_khau: passwordHash,
        vai_tro: 'doi_tac',
      },
    });

    const partner = await tx.doi_tac.create({
      data: {
        ma_nguoi_dung: user.ma_nguoi_dung,
        nguoi_cap_id: adminId,

        ten_cong_ty: data.ten_cong_ty,
        ma_so_thue: data.ma_so_thue,
        dia_chi: data.dia_chi,
        so_dien_thoai: data.so_dien_thoai,
      },
    });

    return {
      user,
      partner,
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