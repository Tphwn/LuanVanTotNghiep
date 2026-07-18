const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const prisma = require('../../config/prisma');
const { notifyAmenityProposal } = require('../../utils/adminNotify');

// Partner đề xuất tiện nghi → thông báo cho admin (không lưu bảng yêu cầu riêng)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const ten_de_xuat = (req.body.ten_de_xuat || req.body.ten_tien_nghi || '').trim();
    const mo_ta = req.body.mo_ta || req.body.ghi_chu || null;
    const loai_de_xuat = req.body.loai_de_xuat || null;

    if (!ten_de_xuat) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên tiện nghi đề xuất' });
    }

    const validLoai = ['khach_san', 'phong', 'ca_hai'];
    const loai = validLoai.includes(loai_de_xuat) ? loai_de_xuat : null;

    const userId = parseInt(req.user.id || req.user.ma_nguoi_dung, 10);
    if (Number.isNaN(userId)) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }

    const doiTac = await prisma.doi_tac.findUnique({
      where: { ma_nguoi_dung: userId },
      select: { ma_doi_tac: true, ten_cong_ty: true },
    });
    if (!doiTac) {
      return res.status(403).json({ success: false, message: 'Không phải đối tác' });
    }

    await notifyAmenityProposal({
      tenDeXuat: ten_de_xuat,
      loaiDeXuat: loai,
      moTa: mo_ta,
      tenDoiTac: doiTac.ten_cong_ty,
    });

    res.status(201).json({
      success: true,
      message: 'Đã gửi đề xuất. Admin sẽ nhận thông báo để xem xét thêm vào danh mục.',
    });
  } catch (err) {
    console.error('Lỗi gửi yêu cầu tiện nghi:', err);
    res.status(500).json({ success: false, message: err.message || 'Lỗi server khi gửi yêu cầu' });
  }
});

module.exports = router;
