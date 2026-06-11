const prisma = require('../../config/prisma');

// Hàm phụ trợ lấy ID đối tác
const getDoiTacId = async (userId) => {
  const dt = await prisma.doi_tac.findUnique({ where: { ma_nguoi_dung: userId } });
  return dt?.ma_doi_tac;
};

exports.getFinanceSummary = async (req, res) => {
  try {
    const doiTacId = await getDoiTacId(req.user.id);
    if (!doiTacId) return res.status(403).json({ success: false, message: 'Không có quyền truy cập' });

    // Nhận ngày bắt đầu và kết thúc từ Frontend (nếu không có thì mặc định lấy tháng hiện tại)
    const { startDate, endDate, ma_khach_san } = req.query;
    
    // Điều kiện lọc cơ bản
    const whereCondition = {
      loai_phong: {
        khach_san: {
          ma_doi_tac: doiTacId,
          ...(ma_khach_san ? { ma_khach_san: Number(ma_khach_san) } : {}) // Lọc thêm theo khách sạn nếu có
        }
      },
      // Chỉ tính tiền các đơn đã hoàn thành hoặc đã xác nhận
      trang_thai: { in: ['hoan_thanh', 'da_xac_nhan'] }, 
      ngay_dat: {
        gte: startDate ? new Date(startDate) : new Date(new Date().setDate(1)), // Mặc định từ đầu tháng
        lte: endDate ? new Date(endDate) : new Date() // Đến hiện tại
      }
    };

    // Truy vấn tất cả đơn phòng kèm theo Hoa hồng và Hoàn tiền
    const bookings = await prisma.dat_phong.findMany({
      where: whereCondition,
      include: {
        hoa_hong: true,
        hoan_tien: true
      },
      orderBy: { ngay_dat: 'asc' } // Sắp xếp theo ngày để vẽ biểu đồ
    });

    // --- TÍNH TOÁN CÁC CHỈ SỐ ---
    let totalGross = 0;
    let totalCommission = 0;
    let totalRefund = 0;

    // Object để nhóm doanh thu theo ngày (dùng cho biểu đồ)
    const chartDataMap = {};

    bookings.forEach(b => {
      const gross = b.thanh_toan_cuoi || 0;
      // Tổng hoa hồng (giả sử bảng hoa_hong trả về mảng hoặc 1 object tùy schema của bạn)
      const commission = Array.isArray(b.hoa_hong) 
        ? b.hoa_hong.reduce((sum, h) => sum + (h.so_tien || 0), 0) 
        : (b.hoa_hong?.so_tien || 0);
      
      const refund = Array.isArray(b.hoan_tien)
        ? b.hoan_tien.reduce((sum, r) => sum + (r.so_tien || 0), 0)
        : (b.hoan_tien?.so_tien || 0);

      totalGross += gross;
      totalCommission += commission;
      totalRefund += refund;

      // Nhóm data cho biểu đồ theo ngày (Format: YYYY-MM-DD)
      const dateKey = new Date(b.ngay_dat).toISOString().split('T')[0];
      if (!chartDataMap[dateKey]) {
        chartDataMap[dateKey] = { date: dateKey, doanh_thu: 0, thuc_nhan: 0 };
      }
      chartDataMap[dateKey].doanh_thu += gross;
      chartDataMap[dateKey].thuc_nhan += (gross - commission - refund);
    });

    // Chuyển object thành mảng cho biểu đồ
    const chartData = Object.values(chartDataMap);

    res.json({
      success: true,
      data: {
        summary: {
          gross: totalGross,
          commission: totalCommission,
          refund: totalRefund,
          net: totalGross - totalCommission - totalRefund
        },
        chartData
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};