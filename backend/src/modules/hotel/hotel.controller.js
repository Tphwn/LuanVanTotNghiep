const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. Lấy tất cả khách sạn (có filter nếu cần)
exports.getAllHotels = async (req, res) => {
    try {
        const hotels = await prisma.khach_san.findMany({
            include: { doi_tac: true } // Lấy thông tin đối tác hiển thị ra list
        });
        res.status(200).json({ success: true, data: hotels });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Xem chi tiết khách sạn (Gồm tiện nghi, phòng, ảnh, thống kê)
exports.getHotelById = async (req, res) => {
    try {
        const hotel = await prisma.khach_san.findUnique({
            where: { ma_khach_san: Number(req.params.id) },
            include: {
                doi_tac: true,
                loai_phong: true,
                tien_nghi: true,
                hinh_anh: true,
                dat_phong: true // Dùng để tính toán thống kê
            }
        });

        if (!hotel) return res.status(404).json({ success: false, message: "Không tìm thấy khách sạn" });
        
        res.status(200).json({ success: true, data: hotel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Duyệt khách sạn
exports.approveHotel = async (req, res) => {
    try {
        const hotel = await prisma.khach_san.update({
            where: { ma_khach_san: Number(req.params.id) },
            data: { trang_thai: 'hoat_dong' }
        });
        res.json({ success: true, data: hotel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. Từ chối kèm lý do
exports.rejectHotel = async (req, res) => {
    try {
        const { lyDo } = req.body;
        const hotel = await prisma.khach_san.update({
            where: { ma_khach_san: Number(req.params.id) },
            data: { trang_thai: 'tu_choi', ghi_chu: lyDo } 
        });
        res.json({ success: true, data: hotel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. Yêu cầu sửa thông tin
exports.requestInfo = async (req, res) => {
    try {
        const { ghiChu } = req.body;
        const hotel = await prisma.khach_san.update({
            where: { ma_khach_san: Number(req.params.id) },
            data: { trang_thai: 'yeu_cau_sua', ghi_chu: ghiChu }
        });
        res.json({ success: true, data: hotel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. Khóa / Mở khóa
exports.toggleLock = async (req, res) => {
    try {
        const { trangThai } = req.body; // 'hoat_dong' hoặc 'bi_khoa'
        const hotel = await prisma.khach_san.update({
            where: { ma_khach_san: Number(req.params.id) },
            data: { trang_thai: trangThai }
        });
        res.json({ success: true, data: hotel });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};