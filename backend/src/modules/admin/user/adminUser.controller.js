const userService = require('./adminUser.service');

const getUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    console.log("PARAMS:", req.params);

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Missing user id parameter',
      });
    }

    const user = await userService.getUserById(Number(id));

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const lockUser = async (req, res, next) => {
  try {
    await userService.lockUser(
      req.params.id
    );

    res.json({
      success: true,
      message: 'Đã khóa tài khoản',
    });
  } catch (error) {
    next(error);
  }
};

const unlockUser = async (req, res, next) => {
  try {
    await userService.unlockUser(
      req.params.id
    );

    res.json({
      success: true,
      message: 'Đã mở khóa tài khoản',
    });
  } catch (error) {
    next(error);
  }
};

const createPartner = async (req, res, next) => {
  try {
    const {
      email,
      email_lien_he,
      so_dien_thoai,
      mat_khau,
      trang_thai,
      ten_cong_ty,
      dia_chi,
      ma_so_thue,
      phan_tram_hoa_hong,
    } = req.body;

    // 1. Khai báo các Regex bảo mật (Giống hệt dưới Frontend)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^(0)(3|5|7|8|9)[0-9]{8}$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
    
    const errors = {};

    // 2. Kiểm tra Email đăng nhập
    if (!email?.trim()) {
      errors.email = 'Email đăng nhập là bắt buộc';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Email đăng nhập không hợp lệ';
    }

    // 3. Kiểm tra Email liên hệ (Nếu có nhập mới test)
    if (email_lien_he?.trim() && !emailRegex.test(email_lien_he.trim())) {
      errors.email_lien_he = 'Email liên hệ không hợp lệ';
    }

    // 4. Kiểm tra Số điện thoại
    if (!so_dien_thoai?.trim()) {
      errors.so_dien_thoai = 'Số điện thoại là bắt buộc';
    } else if (!phoneRegex.test(so_dien_thoai.trim())) {
      errors.so_dien_thoai = 'SĐT không hợp lệ (Phải gồm 10 số, bắt đầu bằng 03,05,07,08,09)';
    }

    // 5. Kiểm tra Mật khẩu
    if (!mat_khau) {
      errors.mat_khau = 'Mật khẩu khởi tạo là bắt buộc';
    } else if (!passwordRegex.test(mat_khau)) {
      errors.mat_khau = 'Mật khẩu tối thiểu 8 ký tự, bao gồm cả chữ và số';
    }

    // 6. Kiểm tra Tên công ty / Đối tác
    if (!ten_cong_ty?.trim()) {
      errors.ten_cong_ty = 'Tên công ty / đối tác là bắt buộc';
    } else if (ten_cong_ty.trim().length < 2) {
      errors.ten_cong_ty = 'Tên công ty phải có ít nhất 2 ký tự';
    }

    // 7. Kiểm tra Trạng thái
    if (trang_thai && !['hoat_dong', 'bi_khoa'].includes(trang_thai)) {
      errors.trang_thai = 'Trạng thái không hợp lệ';
    }

    // 8. Kiểm tra Hoa hồng
    if (phan_tram_hoa_hong !== undefined && phan_tram_hoa_hong !== null && phan_tram_hoa_hong !== '') {
      const pct = Number(phan_tram_hoa_hong);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        errors.phan_tram_hoa_hong = 'Phần trăm hoa hồng phải từ 0 đến 100';
      }
    }

    // Trả về toàn bộ lỗi nếu có (Ngăn chặn không cho xuống Service)
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors });
    }

    // Nếu mọi thứ hoàn hảo, đẩy dữ liệu xuống tầng Service
    const result = await userService.createPartner(
      {
        email: email.trim(),
        email_lien_he: email_lien_he?.trim() || null,
        so_dien_thoai: so_dien_thoai.trim(),
        mat_khau,
        trang_thai: trang_thai || 'hoat_dong',
        ten_cong_ty: ten_cong_ty.trim(),
        dia_chi: dia_chi?.trim() || null,
        ma_so_thue: ma_so_thue?.trim() || null,
        phan_tram_hoa_hong: phan_tram_hoa_hong === '' || phan_tram_hoa_hong == null
          ? 15
          : Number(phan_tram_hoa_hong),
        anh_dai_dien: req.file ? `/uploads/${req.file.filename}` : null,
      },
      req.user.id, // Lấy ID của Admin đang thao tác (từ middleware auth)
    );

    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản đối tác thành công',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  getUserById,
  lockUser,
  unlockUser,
  createPartner,
};