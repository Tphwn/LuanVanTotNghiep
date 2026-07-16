const nodemailer = require('nodemailer');

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

const sendMail = async ({ to, subject, html, text }) => {
  const from = process.env.MAIL_FROM
    || `Hotel Booking <${process.env.SMTP_USER}>`;

  const info = await getTransporter().sendMail({
    from,
    to,
    subject,
    html,
    text,
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

module.exports = { sendMail, sendOtpEmail };
