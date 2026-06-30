import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const base = (content) => `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;background:#0d1423;color:#e8f0fe;padding:32px;border-radius:16px;border:1px solid #1e2a3a;">
    <h2 style="color:#00e5ff;margin:0 0 8px;font-size:22px;">COIN<span style="color:#e8f0fe;">X</span>444</h2>
    ${content}
    <p style="font-size:11px;color:#4a5568;margin-top:24px;">© 2024 CoinX444. Pakistan's Premier Trading Platform.</p>
  </div>`;

export async function sendOTPEmail(email, otp, type = 'verify') {
  const isVerify = type === 'verify';
  const subject = isVerify ? 'Your CoinX444 Verification Code' : 'CoinX444 Password Reset Code';
  const title = isVerify ? 'Verify Your Account' : 'Reset Your Password';
  const msg   = isVerify
    ? 'Use the code below to verify your CoinX444 account.'
    : 'Use the code below to reset your password. If you did not request this, ignore this email.';

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject,
    html: base(`
      <h3 style="color:#e8f0fe;margin:0 0 6px;">${title}</h3>
      <p style="color:#8899bb;font-size:14px;margin:0 0 24px;">${msg}</p>
      <div style="background:#080c14;border:2px dashed #00e5ff;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
        <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#00e5ff;">${otp}</span>
      </div>
      <p style="color:#8899bb;font-size:12px;">This code expires in <strong style="color:#e8f0fe;">10 minutes</strong>.</p>
    `),
  });
}

export async function sendDepositNotification(email, amount, status) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Deposit ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'} — CoinX444`,
    html: base(`
      <h3 style="color:#e8f0fe;margin:0 0 6px;">Deposit Update</h3>
      <p style="color:#8899bb;font-size:14px;">Your deposit of <strong style="color:#e8f0fe;">PKR ${parseFloat(amount).toLocaleString()}</strong> has been <strong style="color:${status === 'approved' ? '#00e676' : '#ff1744'};">${status === 'approved' ? '✅ Approved' : '❌ Rejected'}</strong>.</p>
    `),
  });
}

export async function sendWithdrawalNotification(email, amount, status) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: email,
    subject: `Withdrawal ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'} — CoinX444`,
    html: base(`
      <h3 style="color:#e8f0fe;margin:0 0 6px;">Withdrawal Update</h3>
      <p style="color:#8899bb;font-size:14px;">Your withdrawal of <strong style="color:#e8f0fe;">PKR ${parseFloat(amount).toLocaleString()}</strong> has been <strong style="color:${status === 'approved' ? '#00e676' : '#ff1744'};">${status === 'approved' ? '✅ Approved' : '❌ Rejected'}</strong>.</p>
    `),
  });
}
