const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const prisma = require('../../config/prisma');

// Đối tác gửi đề xuất tiện nghi mới
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { ten_de_xuat, mo_ta } = req.body;
    const doiTac = await prisma.doi_tac.findUnique({
      where: { ma_nguoi_dung: req.user.id },
    });
    if (!doiTac) return res.status(403).json({ success: false, message: 'Không phải đối tác' });

    const data = await prisma.yeu_cau_tien_nghi.create({
      data: {
        ma_doi_tac: doiTac.ma_doi_tac,
        ten_de_xuat,
        mo_ta,
        trang_thai: 'cho_xu_ly',
      },
    });
    res.status(201).json({ success: true, data, message: 'Đã gửi đề xuất' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;