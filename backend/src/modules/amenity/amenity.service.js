const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const amenityService = {
  findAll: async () => {
    return await prisma.tien_nghi.findMany({ orderBy: { ma_tien_nghi: "desc" } });
  },

  create: async (data) => {
    return await prisma.tien_nghi.create({
      data: {
        ten: data.ten,
        bieu_tuong: data.bieu_tuong,
        loai: data.loai,
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
      },
    });
  },

  delete: async (id) => {
    return await prisma.tien_nghi.delete({
      where: { ma_tien_nghi: Number(id) },
    });
  },
  getRequests: async () => {
  return await prisma.yeu_cau_tien_nghi.findMany({
    orderBy: { ngay_yeu_cau: 'desc' },
    include: {
      doi_tac: {
        select: {
          ten_cong_ty: true,
          nguoi_dung: {
            select: { email: true }
          },
        },
      },
      tien_nghi: {
        select: { ten: true, loai: true }
      },
    },
  });
},

// Duyệt yêu cầu → tạo tiện nghi mới luôn
approveRequest: async (id, adminId) => {
  const req = await prisma.yeu_cau_tien_nghi.findUnique({
    where: { ma_yeu_cau: Number(id) },
  });
  if (!req) throw new Error('Không tìm thấy yêu cầu');

  // Tạo tiện nghi mới từ đề xuất
  const newAmenity = await prisma.tien_nghi.create({
    data: {
      ten: req.ten_de_xuat,
      bieu_tuong: req.ten_de_xuat,
      loai: 'ca_hai',
      trang_thai: 'hoat_dong',
    },
  });

  // Cập nhật yêu cầu → đã tạo
  return await prisma.yeu_cau_tien_nghi.update({
    where: { ma_yeu_cau: Number(id) },
    data: {
      trang_thai: 'da_tao',
      tien_nghi_tao_id: newAmenity.ma_tien_nghi,
      admin_xu_ly_id: Number(adminId),
      ngay_phan_hoi: new Date(),
    },
  });
},

// Từ chối yêu cầu kèm lý do
rejectRequest: async (id, adminId, phan_hoi) => {
  return await prisma.yeu_cau_tien_nghi.update({
    where: { ma_yeu_cau: Number(id) },
    data: {
      trang_thai: 'tu_choi',
      phan_hoi,
      admin_xu_ly_id: Number(adminId),
      ngay_phan_hoi: new Date(),
    },
  });
},
};

module.exports = amenityService;