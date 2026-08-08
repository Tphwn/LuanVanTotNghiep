const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.name === 'MulterError' || err.code?.startsWith?.('LIMIT_')) {
    const message = err.code === 'LIMIT_UNEXPECTED_FILE' && err.field === 'images'
      ? 'Chỉ được tải tối đa 30 ảnh'
      : (err.message || 'Lỗi tải file');
    return res.status(400).json({ success: false, message });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi server',
  });
};

module.exports = { errorHandler };