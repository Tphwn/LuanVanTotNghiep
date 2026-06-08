const prisma = require('../../config/prisma');

const roomTypeService = {
  getByHotel: async (ma_ks) => {
    return await prisma.loai_phong.findMany({
      where: { ma_khach_san: Number(ma_ks), NOT: { trang_thai: 'ngung_kinh_doanh' } },
      include: { 
        khach_san: true, 
        loai_phong_tien_nghi: { include: { tien_nghi: true } } 
      }
    });
  },

  // Thêm loại phòng
  create: async (data) => {
    // 1. Tách ma_khach_san ra khỏi data
    const { tien_nghi_ids = [], ma_khach_san, ...rest } = data;
    
    return await prisma.loai_phong.create({
      data: {
        ten_loai: rest.ten_loai,
        mo_ta: rest.mo_ta,
        // 2. Ép kiểu dữ liệu để đảm bảo không bị lỗi Database
        dien_tich: Number(rest.dien_tich) || 0,
        gia_co_ban: Number(rest.gia_co_ban) || 0,
        so_giuong: Number(rest.so_giuong) || 1,
        suc_chua: Number(rest.suc_chua) || 2,
        so_luong_phong: Number(rest.so_luong_phong) || 1,
        trang_thai: 'hoat_dong',

        // 3. MẤU CHỐT: Kết nối với Khách sạn
        khach_san: { 
          connect: { ma_khach_san: Number(ma_khach_san) } 
        },

        // 4. Kết nối với Tiện nghi
        loai_phong_tien_nghi: { 
          create: tien_nghi_ids.map(id => ({ ma_tien_nghi: Number(id) })) 
        }
      }
    });
  },

  // Cập nhật
  update: async (id, data) => {
    const { tien_nghi_ids = [], ...rest } = data;
    
    // Cập nhật thông tin chính (ép kiểu dữ liệu)
    await prisma.loai_phong.update({ 
      where: { ma_loai_phong: Number(id) }, 
      data: {
        ...rest,
        dien_tich: Number(rest.dien_tich),
        gia_co_ban: Number(rest.gia_co_ban),
        so_giuong: Number(rest.so_giuong),
        suc_chua: Number(rest.suc_chua),
        so_luong_phong: Number(rest.so_luong_phong)
      } 
    });

    // Reset tiện nghi (Xóa cũ thêm mới)
    await prisma.loai_phong_tien_nghi.deleteMany({ where: { ma_loai_phong: Number(id) } });
    
    return await prisma.loai_phong.update({
      where: { ma_loai_phong: Number(id) },
      data: { 
        loai_phong_tien_nghi: { 
          create: tien_nghi_ids.map(id => ({ ma_tien_nghi: Number(id) })) 
        } 
      }
    });
  },

  // Ẩn (Soft delete)
  softDelete: async (id) => {
    const hasBooking = await prisma.phieu_dat_phong.findFirst({ where: { ma_loai_phong: Number(id) } });
    if (hasBooking) throw new Error("Không thể ẩn: Loại phòng đã có lịch đặt.");
    return await prisma.loai_phong.update({ where: { ma_loai_phong: Number(id) }, data: { trang_thai: 'ngung_kinh_doanh' } });
  }
};

module.exports = roomTypeService;