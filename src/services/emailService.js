
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email, otp) {

  await resend.emails.send({
    from: 'investifyprofessional@gmail.com',
    to: email,
    subject: `${otp}`,
    text: `${otp}`,
  });
}


// import nodemailer from 'nodemailer';
// import dotenv from 'dotenv';
// dotenv.config();

// const transporter = nodemailer.createTransport({
// host: process.env.SMTP_HOST,
// port: parseInt(process.env.SMTP_PORT) || 587,
// secure: false,
// auth: {
// user: process.env.SMTP_USER,
// pass: process.env.SMTP_PASS
// },
// });

// // ✅ Simple Email Template
// const base = (content) => `

//   <div style="font-family:Arial,sans-serif;max-width:400px;margin:auto;padding:20px;border:1px solid #ddd;border-radius:10px;">
//     <h2 style="margin-bottom:10px;">CoinX444</h2>
//     ${content}
//     <p style="font-size:12px;color:#888;margin-top:20px;">© CoinX444</p>
//   </div>
// `;

// // ✅ OTP Email (Simple)
// export async function sendOTPEmail(email, otp, type = 'verify') {
// const isVerify = type === 'verify';

// transporter.sendMail({
// from: process.env.SMTP_FROM,
// to: email,
// subject: isVerify ? 'Verification Code' : 'Password Reset Code',
// html: base(`       <p>${isVerify ? 'Your verification code is:' : 'Your password reset code is:'}</p>       <h1 style="text-align:center;">${otp}</h1>       <p>This code will expire in 10 minutes.</p>
//     `),
// });
// }

// // ✅ Deposit Notification (Simple)
// export async function sendDepositNotification(email, amount, status) {
// await transporter.sendMail({
// from: process.env.SMTP_FROM,
// to: email,
// subject: `Deposit ${status}`,
// html: base(`       <p>Your deposit of PKR ${parseFloat(amount).toLocaleString()} has been <b>${status}</b>.</p>
//     `),
// });
// }

// // ✅ Withdrawal Notification (Simple)
// export async function sendWithdrawalNotification(email, amount, status) {
// await transporter.sendMail({
// from: process.env.SMTP_FROM,
// to: email,
// subject: `Withdrawal ${status}`,
// html: base(`       <p>Your withdrawal of PKR ${parseFloat(amount).toLocaleString()} has been <b>${status}</b>.</p>
//     `),
// });
// }


// // const transporter = nodemailer.createTransport({
// //   host: process.env.SMTP_HOST,
// //   port: parseInt(process.env.SMTP_PORT) || 587,
// //   secure: false,
// //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
// // });

// // const base = (content) => `
// //   <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;background:#0d1423;color:#e8f0fe;padding:32px;border-radius:16px;border:1px solid #1e2a3a;">
// //     <h2 style="color:#00e5ff;margin:0 0 8px;font-size:22px;">COIN<span style="color:#e8f0fe;">X</span>444</h2>
// //     ${content}
// //     <p style="font-size:11px;color:#4a5568;margin-top:24px;">© 2024 CoinX444. Pakistan's Premier Trading Platform.</p>
// //   </div>`;

// // export async function sendOTPEmail(email, otp, type = 'verify') {
// //   const isVerify = type === 'verify';
// //   const subject = isVerify ? 'Your CoinX444 Verification Code' : 'CoinX444 Password Reset Code';
// //   const title = isVerify ? 'Verify Your Account' : 'Reset Your Password';
// //   const msg   = isVerify
// //     ? 'Use the code below to verify your CoinX444 account.'
// //     : 'Use the code below to reset your password. If you did not request this, ignore this email.';

// //   await transporter.sendMail({
// //     from: process.env.SMTP_FROM,
// //     to: email,
// //     subject,
// //     html: base(`
// //       <h3 style="color:#e8f0fe;margin:0 0 6px;">${title}</h3>
// //       <p style="color:#8899bb;font-size:14px;margin:0 0 24px;">${msg}</p>
// //       <div style="background:#080c14;border:2px dashed #00e5ff;border-radius:12px;padding:20px;text-align:center;margin-bottom:20px;">
// //         <span style="font-family:'Courier New',monospace;font-size:36px;font-weight:700;letter-spacing:12px;color:#00e5ff;">${otp}</span>
// //       </div>
// //       <p style="color:#8899bb;font-size:12px;">This code expires in <strong style="color:#e8f0fe;">10 minutes</strong>.</p>
// //     `),
// //   });
// // }

// // export async function sendDepositNotification(email, amount, status) {
// //   await transporter.sendMail({
// //     from: process.env.SMTP_FROM,
// //     to: email,
// //     subject: `Deposit ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'} — CoinX444`,
// //     html: base(`
// //       <h3 style="color:#e8f0fe;margin:0 0 6px;">Deposit Update</h3>
// //       <p style="color:#8899bb;font-size:14px;">Your deposit of <strong style="color:#e8f0fe;">PKR ${parseFloat(amount).toLocaleString()}</strong> has been <strong style="color:${status === 'approved' ? '#00e676' : '#ff1744'};">${status === 'approved' ? '✅ Approved' : '❌ Rejected'}</strong>.</p>
// //     `),
// //   });
// // }

// // export async function sendWithdrawalNotification(email, amount, status) {
// //   await transporter.sendMail({
// //     from: process.env.SMTP_FROM,
// //     to: email,
// //     subject: `Withdrawal ${status === 'approved' ? 'Approved ✅' : 'Rejected ❌'} — CoinX444`,
// //     html: base(`
// //       <h3 style="color:#e8f0fe;margin:0 0 6px;">Withdrawal Update</h3>
// //       <p style="color:#8899bb;font-size:14px;">Your withdrawal of <strong style="color:#e8f0fe;">PKR ${parseFloat(amount).toLocaleString()}</strong> has been <strong style="color:${status === 'approved' ? '#00e676' : '#ff1744'};">${status === 'approved' ? '✅ Approved' : '❌ Rejected'}</strong>.</p>
// //     `),
// //   });
// // }
