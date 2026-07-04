
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
const response = await resend.emails.send({
from: 'Investify [no-reply@investify45.qzz.io](mailto:no-reply@investify45.qzz.io)',
to: email,
subject: 'Your Investify Verification Code',
text: `Your Investify OTP code is ${otp}. It will expire in 5 minutes. If you did not request this, please ignore this email.`,
html: `         <div style="font-family: Arial, sans-serif; line-height: 1.6;">           <h2>Investify Verification</h2>           <p>Your OTP code is:</p>           <h1 style="letter-spacing: 2px;">${otp}</h1>           <p>This code will expire in <b>5 minutes</b>.</p>           <br/>           <p>If you did not request this, you can safely ignore this email.</p>           <hr/>           <p style="font-size: 12px; color: gray;">
            © Investify - Secure Authentication System           </p>         </div>
      `,
});

```
console.log("Email sent:", response);
```

} catch (error) {
console.error("Email error:", error);
}
}
