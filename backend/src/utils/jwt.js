const jwt = require('jsonwebtoken');
require('dotenv').config();

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
const signGuestPayToken = (maDatPhong, email) => jwt.sign(
  { typ: 'guest_pay', mid: Number(maDatPhong), email: String(email || '').trim().toLowerCase() },
  process.env.JWT_SECRET,
  { expiresIn: '2h' },
);
const signGuestLookupToken = (maDatPhong) => jwt.sign(
  { typ: 'guest_lookup', mid: Number(maDatPhong) },
  process.env.JWT_SECRET,
  { expiresIn: '30m' },
);

const verifyGuestPayToken = (token) => {
  const payload = verifyToken(token);
  if (payload?.typ !== 'guest_pay' || !payload.mid) {
    throw new Error('Token khách không hợp lệ');
  }
  return payload;
};

const verifyGuestLookupToken = (token) => {
  const payload = verifyToken(token);
  if (payload?.typ !== 'guest_lookup' || !payload.mid) {
    throw new Error('Token tra cứu không hợp lệ');
  }
  return payload;
};

module.exports = {
  generateToken,
  verifyToken,
  signGuestPayToken,
  signGuestLookupToken,
  verifyGuestPayToken,
  verifyGuestLookupToken,
};