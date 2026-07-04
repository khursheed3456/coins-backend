
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOTPEmail(email, otp) {

  await resend.emails.send({
    from: 'no-reply@investify45.qzz.io',
    to: email,
    subject: `${otp}`,
    text: `${otp}`,
  });
}