
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
  from: 'team@investify45.qzz.io',
  to: email,
  subject: otp,
  text: `Your verification code is ${otp}`,
});

} catch (error) {
console.error("Email error:", error);
}
}
