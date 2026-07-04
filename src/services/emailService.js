
// import { Resend } from 'resend';
// import dotenv from 'dotenv';
// dotenv.config();

// const resend = new Resend(process.env.RESEND_API_KEY);

// export async function sendOTPEmail(email, otp) {

//   await resend.emails.send({
//     from: 'no-reply@investify45.qzz.io',
//     to: email,
//     subject: `${otp}`,
//     text: `${otp}`,
//   });
// }

import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email, otp) {
try {
await resend.emails.send({
  from: 'Investify <team@investify45.qzz.io>',
  to: email,
  subject: 'Your Investify Verification Code',
  text: `Your verification code is ${otp}. It expires in 5 minutes.`,
  html: `
    <div style="font-family: Arial;">
      <h2>Investify</h2>
      <p>Your OTP code:</p>
      <h1>${otp}</h1>
      <p>Expires in 5 minutes.</p>
      <p>If you didn’t request this, ignore it.</p>
    </div>
  `,
});

} catch (error) {
console.error("Email error:", error);
}
}
