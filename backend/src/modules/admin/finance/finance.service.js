const prisma = require('../../../config/prisma');

const adminFinanceService = {
  // ================= 1. TỔNG QUAN TÀI CHÍNH =================
  getOverview: async () => {
    // Tổng doanh thu (Các đơn đã hoàn thành/xác nhận)
    const dt = await prisma.dat_phong.aggregate({
      _sum: { thanh_toan_cuoi: true },
      where: { trang_thai: { in: ['hoan_thanh', 'da_xac_nhan'] } }
    });
    
    // Tổng hoa hồng
    const hh = await prisma.hoa_hong.aggregate({
      _sum: { so_tien_hoa_hong: true },
      where: { trang_thai: 'da_thu' }
    });

    // Tổng hoàn tiền
    const ht = await prisma.hoan_tien.aggregate({
      _sum: { so_tien_hoan: true },
      where: { trang_thai: 'da_hoan' }
    });

    const soDonThanhCong = await prisma.dat_phong.count({ where: { trang_thai: 'hoan_thanh' }});
    const soDonHoanTien = await prisma.hoan_tien.count({ where: { trang_thai: 'da_hoan' }});

    return {
      tong_doanh_thu: dt._sum.thanh_toan_cuoi || 0,
      tong_hoa_hong: hh._sum.so_tien_hoa_hong || 0,
      tong_hoan_tien: ht._sum.so_tien_hoan || 0,
      doanh_thu_thuc_nhan: (hh._sum.so_tien_hoa_hong || 0), // Lợi nhuận của OTA chính là Hoa hồng
      so_don_thanh_cong: soDonThanhCong,
      so_don_hoan_tien: soDonHoanTien
    };
  },

  // ================= 2. HOA HỒNG =================
  getCommissions: async (filters) => {
    return await prisma.hoa_hong.findMany({
      include: {
        doi_tac: true,
        dat_phong: { include: { khach_hang: true, loai_phong: { include: { khach_san: true } } } }
      },
      orderBy: { ngay_tinh: 'desc' }
    });
  },

  getCommissionStats: async () => {
    const today = new Date(); today.setHours(0,0,0,0);
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const firstDayOfYear = new Date(today.getFullYear(), 0, 1);

    const calc = async (date) => {
      const res = await prisma.hoa_hong.aggregate({
        _sum: { so_tien_hoa_hong: true },
        where: { ngay_tinh: { gte: date }, trang_thai: 'da_thu' }
      });
      return res._sum.so_tien_hoa_hong || 0;
    };

    return {
      hom_nay: await calc(today),
      thang_nay: await calc(firstDayOfMonth),
      nam_nay: await calc(firstDayOfYear)
    };
  },

  // ================= 3. ĐỐI SOÁT (RECONCILIATION) =================
  getReconciliations: async () => {
    return await prisma.doi_soat.findMany({
      include: { doi_tac: true },
      orderBy: [{ thang_nam: 'desc' }, { ma_doi_soat: 'desc' }]
    });
  },

  // Hàm tự động tính toán đối soát cho 1 tháng (VD: "05/2026")
  calculateReconciliation: async (thang_nam, ma_doi_tac) => {
    const [month, year] = thang_nam.split('/');
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Ngày cuối tháng

    // 1. Tính tổng doanh thu tháng đó của đối tác
    const dt = await prisma.dat_phong.aggregate({
      _sum: { thanh_toan_cuoi: true },
      where: { 
        loai_phong: { khach_san: { ma_doi_tac: Number(ma_doi_tac) } },
        trang_thai: { in: ['hoan_thanh', 'da_xac_nhan'] },
        ngay_nhan_phong: { gte: startDate, lte: endDate }
      }
    });

    // 2. Tính tổng hoa hồng
    const hh = await prisma.hoa_hong.aggregate({
      _sum: { so_tien_hoa_hong: true },
      where: { ma_doi_tac: Number(ma_doi_tac), ngay_tinh: { gte: startDate, lte: endDate } }
    });

    // 3. Tính tổng hoàn tiền
    const ht = await prisma.hoan_tien.aggregate({
      _sum: { so_tien_hoan: true },
      where: { 
        dat_phong: { loai_phong: { khach_san: { ma_doi_tac: Number(ma_doi_tac) } } },
        trang_thai: 'da_hoan',
        ngay_xu_ly: { gte: startDate, lte: endDate }
      }
    });

    const doanhThu = dt._sum.thanh_toan_cuoi || 0;
    const hoaHong = hh._sum.so_tien_hoa_hong || 0;
    const hoanTien = ht._sum.so_tien_hoan || 0;
    const thanhToanDoiTac = doanhThu - hoaHong - hoanTien;

    // 4. Lưu vào bảng doi_soat (Dùng upsert để nếu có rồi thì cập nhật, chưa có thì tạo)
    return await prisma.doi_soat.upsert({
      where: { uq_doi_soat: { ma_doi_tac: Number(ma_doi_tac), thang_nam: thang_nam } },
      update: {
        tong_doanh_thu: doanhThu, tong_hoa_hong: hoaHong, tong_hoan_tien: hoanTien, thanh_toan_doi_tac: thanhToanDoiTac
      },
      create: {
        ma_doi_tac: Number(ma_doi_tac), thang_nam,
        tong_doanh_thu: doanhThu, tong_hoa_hong: hoaHong, tong_hoan_tien: hoanTien, thanh_toan_doi_tac: thanhToanDoiTac
      }
    });
  }
};

module.exports = adminFinanceService;