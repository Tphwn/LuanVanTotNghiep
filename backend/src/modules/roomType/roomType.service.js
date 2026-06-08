const prisma = require('../../config/prisma');

const roomTypeService = {
 getByHotel: async () => {
  return await prisma.loai_phong.findMany({
    where: {
      trang_thai: 'hoat_dong'
    },
    include: {
      khach_san: true,
      loai_phong_tien_nghi: {
        include: {
          tien_nghi: true
        }
      }
    }
  });
},
    getAll: async () => {
        return await prisma.loai_phong.findMany({
        where: { NOT: { trang_thai: 'ngung_kinh_doanh' } },
        include: { 
            khach_san: true, 
            loai_phong_tien_nghi: { include: { tien_nghi: true } } 
        }
    });
  },
  // Thêm loại phòng
  create: async (data) => {
    const { tien_nghi_ids = [], ...rest } = data;
    const gia = parseFloat(String(rest.gia_co_ban).replace(/\./g, '').replace(/,/g, '')) || 0;
    
    const dienTich = parseFloat(String(rest.dien_tich || 0).replace(',', '.'));

    let arrTienNghi = Array.isArray(tien_nghi_ids) ? tien_nghi_ids : [tien_nghi_ids];
    arrTienNghi = arrTienNghi.filter(Boolean).map(id => Number(id));

    return await prisma.loai_phong.create({
      data: {
        ma_khach_san: Number(rest.ma_khach_san),
        ten_loai: rest.ten_loai,
        dien_tich: dienTich,
        gia_co_ban: gia,
        so_giuong: Number(rest.so_giuong) || 0,
        suc_chua: Number(rest.suc_chua) || 1,
        so_luong_phong: Number(rest.so_luong_phong) || 1,
        mo_ta: rest.mo_ta || "",
        trang_thai: 'hoat_dong',
        loai_phong_tien_nghi: { 
          create: arrTienNghi.map(id => ({ ma_tien_nghi: id })) 
        }
      }
    });
  },

  // Cập nhật
  update: async (id, data) => {
    const { tien_nghi_ids = [], file, ...rest } = data;
    
    const updateData = { ...rest };
    if (updateData.ma_khach_san) updateData.ma_khach_san = Number(updateData.ma_khach_san);
    if (updateData.dien_tich) updateData.dien_tich = Number(updateData.dien_tich);
    if (updateData.gia_co_ban) updateData.gia_co_ban = Number(updateData.gia_co_ban);
    if (updateData.so_giuong) updateData.so_giuong = Number(updateData.so_giuong);
    if (updateData.suc_chua) updateData.suc_chua = Number(updateData.suc_chua);
    if (updateData.so_luong_phong) updateData.so_luong_phong = Number(updateData.so_luong_phong);

    let arrTienNghi = Array.isArray(tien_nghi_ids) ? tien_nghi_ids : [tien_nghi_ids];
    arrTienNghi = arrTienNghi.filter(Boolean).map(id => Number(id));

    await prisma.loai_phong_tien_nghi.deleteMany({ where: { ma_loai_phong: Number(id) } });
    return await prisma.loai_phong.update({
      where: { ma_loai_phong: Number(id) },
      data: { 
        ...updateData, 
        loai_phong_tien_nghi: { create: arrTienNghi.map(id => ({ ma_tien_nghi: id })) } 
      }
    });
  },

  // Ẩn (Soft delete)
  softDelete: async (id) => {
    const hasBooking = await prisma.phieu_dat_phong.findFirst({ where: { ma_loai_phong: Number(id) } });
    if (hasBooking) throw new Error("Không thể ẩn: Loại phòng đã có lịch đặt.");
    return await prisma.loai_phong.update({ where: { ma_loai_phong: Number(id) }, data: {
  trang_thai: 'an'
} });
  }
};
module.exports = roomTypeService;