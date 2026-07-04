import { User, OTP } from '../models/index.js';
import {
  hashPassword, verifyPassword, createSession,
  revokeToken, generateReferralCode, generateOpaqueToken,
} from '../services/tokenService.js';
import { sendOTPEmail } from '../services/emailService.js';
import { authenticate } from '../middleware/auth.js';
import { Op } from 'sequelize';

function generateOTPCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createOTP(email, type) {
  // Invalidate old OTPs
  await OTP.destroy({ where: { email, type, used: false } });
  const code = generateOTPCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
  await OTP.create({ email, code, type, expiresAt });
  return code;
}

export default async function authRoutes(fastify) {
  // ── REGISTER ──
  fastify.post('/register', async (request, reply) => {
    const { email, password, confirmPassword, referralCode } = request.body;
    if (!email || !password || !confirmPassword)
      return reply.status(400).send({ error: 'All fields are required' });
    if (password !== confirmPassword)
      return reply.status(400).send({ error: 'Passwords do not match' });
    if (password.length < 8)
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });

    const existing = await User.findOne({ where: { email } });
    if (existing) return reply.status(400).send({ error: 'Email already registered' });

    let referrerId = null;
    if (referralCode) {
      const referrer = await User.findOne({ where: { referralCode } });
      if (!referrer) return reply.status(400).send({ error: 'Invalid referral code' });
      referrerId = referrer.id;
    }

    const passwordHash = hashPassword(password);
    const myReferralCode = generateReferralCode();

    await User.create({
      email, passwordHash,
      referralCode: myReferralCode,
      referredBy: referrerId,
    });

    // Send OTP
    const code = await createOTP(email, 'verify');
    await sendOTPEmail(email, code).catch(() => {});

    return reply.status(201).send({ message: 'Account created. Check your email for the OTP code.' });
  });

  // ── VERIFY OTP ──
  fastify.post('/verify-otp', async (request, reply) => {
    const { email, otp } = request.body;
    if (!email || !otp) return reply.status(400).send({ error: 'Email and OTP required' });

    const record = await OTP.findOne({
      where: {
        email, code: otp, type: 'verify', used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    if (!record) return reply.status(400).send({ error: 'Invalid or expired OTP' });

    const user = await User.findOne({ where: { email } });
    if (!user) return reply.status(400).send({ error: 'User not found' });

    user.isVerified = true;
    await user.save();
    record.used = true;
    await record.save();

    return reply.send({ message: 'Email verified successfully! You can now log in.' });
  });

  // ── RESEND OTP ──
  fastify.post('/resend-otp', async (request, reply) => {
    const { email } = request.body;
    if (!email) return reply.status(400).send({ error: 'Email required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return reply.status(400).send({ error: 'User not found' });
    if (user.isVerified) return reply.status(400).send({ error: 'Email already verified' });

    const code = await createOTP(email, 'verify');
    await sendOTPEmail(email, code).catch(() => {});

    return reply.send({ message: 'OTP resent. Check your email.' });
  });

  // ── LOGIN ──
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body;
    if (!email || !password) return reply.status(400).send({ error: 'Email and password required' });

    const user = await User.findOne({ where: { email } });
    if (!user) return reply.status(401).send({ error: 'Invalid credentials' });

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) return reply.status(401).send({ error: 'Invalid credentials' });

    if (!user.isVerified) return reply.status(403).send({ error: 'Please verify your email first', needsVerification: true, email });

    const { token } = await createSession(user.id, request.ip, request.headers['user-agent']);

    return reply.send({
      token,
      user: {
        id: user.id, email: user.email, role: user.role,
        balance: user.balance, referralCode: user.referralCode,
        referralEarnings: user.referralEarnings, hasDeposited: user.hasDeposited,
      },
    });
  });

  // ── FORGOT PASSWORD ──
  fastify.post('/forgot-password', async (request, reply) => {
    const { email } = request.body;
    if (!email) return reply.status(400).send({ error: 'Email required' });

    const user = await User.findOne({ where: { email } });
    // Don't reveal if user exists
    if (!user) return reply.send({ message: 'If that email exists, a reset code has been sent.' });

    const code = await createOTP(email, 'reset');
    await sendOTPEmail(email, code, 'reset').catch(() => {});

    return reply.send({ message: 'If that email exists, a reset code has been sent.' });
  });

  // ── VERIFY RESET OTP ──
  fastify.post('/verify-reset-otp', async (request, reply) => {
    const { email, otp } = request.body;
    if (!email || !otp) return reply.status(400).send({ error: 'Email and OTP required' });

    const record = await OTP.findOne({
      where: {
        email, code: otp, type: 'reset', used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    if (!record) return reply.status(400).send({ error: 'Invalid or expired OTP' });

    // Issue a one-time reset token (reuse opaque token logic)
    const resetToken = await generateOpaqueToken();
    record.used = true;
    await record.save();

    // Store token temporarily in a new OTP record so we can validate it
    await OTP.create({
      email,
      code: resetToken,
      type: 'reset',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      used: false,
    });

    return reply.send({ resetToken, message: 'OTP verified. Proceed to reset your password.' });
  });

  // ── RESET PASSWORD ──
  fastify.post('/reset-password', async (request, reply) => {
    const { email, resetToken, newPassword } = request.body;
    if (!email || !resetToken || !newPassword)
      return reply.status(400).send({ error: 'All fields required' });
    if (newPassword.length < 8)
      return reply.status(400).send({ error: 'Password must be at least 8 characters' });

    const record = await OTP.findOne({
      where: {
        email, code: resetToken, type: 'reset', used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });
    if (!record) return reply.status(400).send({ error: 'Invalid or expired reset token' });

    const user = await User.findOne({ where: { email } });
    if (!user) return reply.status(400).send({ error: 'User not found' });

    user.passwordHash = hashPassword(newPassword);
    await user.save();
    record.used = true;
    await record.save();

    return reply.send({ message: 'Password reset successfully. You can now log in.' });
  });

  // ── LOGOUT ──
  fastify.post('/logout', { preHandler: authenticate }, async (request, reply) => {
    const token = request.headers.authorization.split(' ')[1];
    await revokeToken(token);
    return reply.send({ message: 'Logged out' });
  });

  // ── ME ──
  fastify.get('/me', { preHandler: authenticate }, async (request, reply) => {
    const u = request.user;
    return reply.send({
      id: u.id, email: u.email, role: u.role,
      balance: u.balance, referralCode: u.referralCode,
      referralEarnings: u.referralEarnings, hasDeposited: u.hasDeposited,
    });
  });
}
