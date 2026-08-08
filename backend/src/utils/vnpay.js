const crypto = require('crypto');

const getConfig = () => {
  const tmnCode = process.env.VNP_TMN_CODE;
  const hashSecret = process.env.VNP_HASH_SECRET;
  const vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = process.env.VNP_RETURN_URL;
  if (!tmnCode || !hashSecret || !returnUrl) {
    const err = new Error('Thiếu cấu hình VNPay (VNP_TMN_CODE, VNP_HASH_SECRET, VNP_RETURN_URL)');
    err.statusCode = 500;
    throw err;
  }
  return { tmnCode, hashSecret, vnpUrl, returnUrl };
};

const formatVnpDate = (date = new Date()) => {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${vn.getUTCFullYear()}`
    + `${pad(vn.getUTCMonth() + 1)}`
    + `${pad(vn.getUTCDate())}`
    + `${pad(vn.getUTCHours())}`
    + `${pad(vn.getUTCMinutes())}`
    + `${pad(vn.getUTCSeconds())}`
  );
};

const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj).filter((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== '');
  keys.sort();
  keys.forEach((key) => {
    sorted[key] = encodeURIComponent(String(obj[key])).replace(/%20/g, '+');
  });
  return sorted;
};

const signParams = (params, hashSecret) => {
  const sorted = sortObject(params);
  const signData = Object.keys(sorted)
    .map((key) => `${key}=${sorted[key]}`)
    .join('&');
  return crypto.createHmac('sha512', hashSecret).update(Buffer.from(signData, 'utf-8')).digest('hex');
};

/**
 * @param {{ amountVnd: number, orderInfo: string, ipAddr: string, txnRef: string, expireMinutes?: number }} 
 * @returns {string} 
 */
const buildPaymentUrl = (opts) => {
  const { tmnCode, hashSecret, vnpUrl, returnUrl } = getConfig();
  const amountVnd = Math.round(Number(opts.amountVnd) || 0);
  if (amountVnd <= 0) {
    const err = new Error('Số tiền thanh toán không hợp lệ');
    err.statusCode = 400;
    throw err;
  }

  const createDate = formatVnpDate();
  const expireMinutes = opts.expireMinutes || 15;
  const expireDate = formatVnpDate(new Date(Date.now() + expireMinutes * 60 * 1000));

  const vnpParams = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: tmnCode,
    vnp_Amount: String(amountVnd * 100),
    vnp_CurrCode: 'VND',
    vnp_TxnRef: String(opts.txnRef),
    vnp_OrderInfo: String(opts.orderInfo || `Thanh toan don ${opts.txnRef}`).slice(0, 255),
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: String(opts.ipAddr || '127.0.0.1'),
    vnp_CreateDate: createDate,
    vnp_ExpireDate: expireDate,
  };

  const secureHash = signParams(vnpParams, hashSecret);
  const sorted = sortObject(vnpParams);
  const query = Object.keys(sorted)
    .map((key) => `${key}=${sorted[key]}`)
    .join('&');

  return `${vnpUrl}?${query}&vnp_SecureHash=${secureHash}`;
};

const RESPONSE_MESSAGES = {
  '00': 'Giao dịch thành công',
  '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
  '09': 'Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking',
  '10': 'Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
  '11': 'Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.',
  '12': 'Thẻ/Tài khoản bị khóa',
  '13': 'Nhập sai OTP',
  '24': 'Khách hàng hủy giao dịch',
  '51': 'Tài khoản không đủ số dư',
  '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
  '75': 'Ngân hàng thanh toán đang bảo trì',
  '79': 'Nhập sai mật khẩu thanh toán quá số lần quy định',
  '99': 'Các lỗi khác',
};

/**
 * @param {Record<string, string>} 
 */
const verifyReturn = (query = {}) => {
  const { hashSecret } = getConfig();
  const raw = { ...query };
  const secureHash = raw.vnp_SecureHash || raw.vnp_securehash;
  delete raw.vnp_SecureHash;
  delete raw.vnp_SecureHashType;
  delete raw.vnp_securehash;
  delete raw.vnp_securehashtype;

  const signed = signParams(raw, hashSecret);
  const valid = Boolean(secureHash) && signed.toLowerCase() === String(secureHash).toLowerCase();
  const responseCode = String(raw.vnp_ResponseCode || '');

  return {
    valid,
    responseCode,
    success: valid && responseCode === '00',
    txnRef: raw.vnp_TxnRef || null,
    transactionNo: raw.vnp_TransactionNo || null,
    amount: raw.vnp_Amount ? Number(raw.vnp_Amount) / 100 : null,
    bankCode: raw.vnp_BankCode || null,
    message: RESPONSE_MESSAGES[responseCode] || `Mã phản hồi: ${responseCode || '—'}`,
    raw,
  };
};

module.exports = {
  buildPaymentUrl,
  verifyReturn,
  formatVnpDate,
  getConfig,
};
