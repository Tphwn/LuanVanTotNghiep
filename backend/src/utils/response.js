const success = (res, data = null, message = 'Thành công', statusCode = 200) => {
  const body = { success: true, message };
  if (data !== null && data !== undefined) body.data = data;
  return res.status(statusCode).json(body);
};

const error = (res, message = 'Lỗi server', statusCode = 500) => {
  return res.status(statusCode).json({ success: false, message });
};

module.exports = { success, error };