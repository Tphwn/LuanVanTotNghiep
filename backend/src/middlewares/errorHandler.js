const errorHandler = (err, req, res, next) => {
  // Log toàn bộ lỗi ra console để dễ dàng debug
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Lỗi server',
  });
};

module.exports = { errorHandler };