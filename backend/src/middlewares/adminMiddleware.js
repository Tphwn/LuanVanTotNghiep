const adminMiddleware = (req, res, next) => {
  if (req.user.vai_tro !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Không có quyền truy cập',
    });
  }

  next();
};

module.exports = adminMiddleware;