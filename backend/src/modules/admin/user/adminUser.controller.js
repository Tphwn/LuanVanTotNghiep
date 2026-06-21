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
      so_dien_thoai,
      mat_khau,
      trang_thai,
      ten_cong_ty,
      dia_chi,
      ma_so_thue,
      phan_tram_hoa_hong,
    } = req.body;

    const errors = {};
    if (!email?.trim()) errors.email = 'Email đăng nhập là bắt buộc';
    if (!so_dien_thoai?.trim()) errors.so_dien_thoai = 'Số điện thoại là bắt buộc';
    if (!mat_khau?.trim()) errors.mat_khau = 'Mật khẩu tạm là bắt buộc';
    else if (mat_khau.length < 6) errors.mat_khau = 'Mật khẩu tối thiểu 6 ký tự';
    if (!ten_cong_ty?.trim()) errors.ten_cong_ty = 'Tên công ty / đối tác là bắt buộc';
    if (trang_thai && !['hoat_dong', 'bi_khoa'].includes(trang_thai)) {
      errors.trang_thai = 'Trạng thái không hợp lệ';
    }
    if (phan_tram_hoa_hong !== undefined && phan_tram_hoa_hong !== null && phan_tram_hoa_hong !== '') {
      const pct = Number(phan_tram_hoa_hong);
      if (Number.isNaN(pct) || pct < 0 || pct > 100) {
        errors.phan_tram_hoa_hong = 'Phần trăm hoa hồng phải từ 0 đến 100';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ', errors });
    }

    const result = await userService.createPartner(
      {
        email: email.trim(),
        so_dien_thoai: so_dien_thoai.trim(),
        mat_khau,
        trang_thai: trang_thai || 'hoat_dong',
        ten_cong_ty: ten_cong_ty.trim(),
        dia_chi: dia_chi?.trim() || null,
        ma_so_thue: ma_so_thue?.trim() || null,
        phan_tram_hoa_hong: phan_tram_hoa_hong === '' || phan_tram_hoa_hong == null
          ? null
          : Number(phan_tram_hoa_hong),
        anh_dai_dien: req.file ? `/uploads/${req.file.filename}` : null,
      },
      req.user.id,
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