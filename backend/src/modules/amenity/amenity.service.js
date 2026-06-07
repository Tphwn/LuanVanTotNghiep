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
};

module.exports = amenityService;