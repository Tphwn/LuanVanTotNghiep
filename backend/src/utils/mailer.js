const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) {
    throw new Error('Chưa cấu hình SMTP_USER / SMTP_PASS');
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });

  return transporter;
};

const sendMail = async ({ to, subject, html, text, attachments }) => {
  const from = process.env.MAIL_FROM
    || `Hotel Booking <${process.env.SMTP_USER}>`;

  const info = await getTransporter().sendMail({
    from,
    to,
    subject,
    html,
    text,
    attachments,
  });

  return info;
};

const sendOtpEmail = async ({ to, otp, purpose }) => {
  const isRegister = purpose === 'register';
  const title = isRegister ? 'Xác thực đăng ký tài khoản' : 'Mã OTP đặt lại mật khẩu';
  const intro = isRegister
    ? 'Bạn đang đăng ký tài khoản Hotel Booking. Nhập mã OTP sau để xác thực email:'
    : 'Bạn yêu cầu đặt lại mật khẩu Hotel Booking. Nhập mã OTP sau để tiếp tục:';

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e8ecea;border-radius:12px">
      <h2 style="color:#3C7363;margin:0 0 12px">${title}</h2>
      <p style="color:#334155;line-height:1.5">${intro}</p>
      <p style="font-size:32px;font-weight:700;letter-spacing:8px;color:#1a2e28;margin:20px 0;text-align:center">${otp}</p>
      <p style="color:#64748b;font-size:13px;margin:0">Mã có hiệu lực trong <strong>10 phút</strong>. Không chia sẻ mã này cho người khác.</p>
    </div>
  `;

  return sendMail({
    to,
    subject: `[Hotel Booking] ${title}`,
    html,
    text: `${intro}\n\nMã OTP: ${otp}\nHiệu lực 10 phút.`,
  });
};

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const formatMoneyVnd = (amount) => {
  const n = Number(amount) || 0;
  return `${n.toLocaleString('vi-VN')} VNĐ`;
};

const formatMailDate = (value) => {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const resolveLogoAttachment = () => {
  const candidates = [
    path.join(__dirname, '../../uploads/logo.png'),
    path.join(__dirname, '../../../frontend/public/favicon.svg'),
  ];
  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      return {
        filename: path.basename(filePath),
        path: filePath,
        cid: 'hotelbooking-logo',
        contentType: ext === '.svg' ? 'image/svg+xml' : undefined,
      };
    }
  }
  return null;
};

const sendBookingConfirmationEmail = async ({
  to,
  maDonHang,
  tenKhachSan,
  tenLoaiPhong,
  ngayNhan,
  ngayTra,
  soPhong,
  phuongThuc,
  tongTien,
}) => {
  if (!to) {
    throw new Error('Thiếu email người nhận');
  }

  const stayLabel = `${formatMailDate(ngayNhan)} → ${formatMailDate(ngayTra)}`;
  const rows = [
    ['Mã đặt phòng', maDonHang || '—'],
    ['Khách sạn', tenKhachSan || '—'],
    ['Loại phòng', tenLoaiPhong || '—'],
    ['Ngày lưu trú', stayLabel],
    ['Số phòng', String(Math.max(Number(soPhong) || 1, 1))],
    ['Phương thức', phuongThuc || 'Trực tuyến'],
    ['Tổng tiền thanh toán', formatMoneyVnd(tongTien)],
  ];

  const rowHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #e8ecea;color:#5a7a72;font-size:13px;width:42%">${escapeHtml(label)}</td>
      <td style="padding:10px 0;border-bottom:1px solid #e8ecea;color:#1a2e28;font-size:14px;font-weight:600;text-align:right">${escapeHtml(value)}</td>
    </tr>
  `).join('');

  const logoAttachment = resolveLogoAttachment();
  const logoBlock = logoAttachment
    ? `<img src="cid:hotelbooking-logo" alt="Hotel Booking" width="200" style="display:block;margin:0 auto 14px;max-width:200px;height:auto" />`
    : `<div style="font-size:20px;font-weight:700;color:#3C7363;letter-spacing:0.02em;margin-bottom:12px">Hotel Booking</div>`;

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;background:#f5f8f7;padding:24px 12px">
      <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e8ecea;border-radius:14px;padding:28px 24px">
        <div style="text-align:center;margin-bottom:20px">
          ${logoBlock}
        </div>
        <h2 style="margin:0 0 8px;color:#1a2e28;font-size:20px;text-align:center">Đặt phòng thành công!</h2>
        <p style="margin:0 0 20px;color:#5a7a72;font-size:14px;line-height:1.5;text-align:center">
          Hệ thống đã ghi nhận thanh toán của bạn. Chi tiết đơn như sau:
        </p>
        <table style="width:100%;border-collapse:collapse">${rowHtml}</table>
        <p style="margin:20px 0 0;color:#64748b;font-size:12px;line-height:1.5">
          Nếu bạn không nhận được email này trong hộp thư chính, vui lòng kiểm tra mục Thư rác (Spam)
          hoặc liên hệ Hotline <strong>0777443088</strong>.
        </p>
      </div>
    </div>
  `;

  const text = [
    'Đặt phòng thành công — HotelBooking',
    ...rows.map(([label, value]) => `${label}: ${value}`),
    '',
    'Hotline: 0777443088',
  ].join('\n');

  return sendMail({
    to,
    subject: `[HotelBooking] Xác nhận đặt phòng ${maDonHang || ''}`.trim(),
    html,
    text,
    attachments: logoAttachment ? [logoAttachment] : undefined,
  });
};

module.exports = {
  sendMail,
  sendOtpEmail,
  sendBookingConfirmationEmail,
};
