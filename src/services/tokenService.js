import sodium from 'libsodium-wrappers-sumo';
import { Session } from '../models/index.js';

await sodium.ready;

export async function generateOpaqueToken() {
  const randomBytes = sodium.randombytes_buf(48);
  const token = sodium.to_hex(randomBytes);
  return token;
}

export async function createSession(userId, ipAddress, userAgent) {
  const token = await generateOpaqueToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const session = await Session.create({
    userId,
    token,
    expiresAt,
    ipAddress,
    userAgent,
  });

  return { token, session };
}

export async function validateToken(token) {
  if (!token) return null;

  const session = await Session.findOne({
    where: { token },
  });

  if (!session) return null;
  if (new Date() > session.expiresAt) {
    await session.destroy();
    return null;
  }

  return session;
}

export async function revokeToken(token) {
  await Session.destroy({ where: { token } });
}

export async function revokeAllUserTokens(userId) {
  await Session.destroy({ where: { userId } });
}

export function hashPassword(password) {
  const salt = sodium.crypto_pwhash_SALTBYTES
    ? sodium.randombytes_buf(sodium.crypto_pwhash_SALTBYTES)
    : sodium.randombytes_buf(16);

  const hash = sodium.crypto_pwhash_str(
    password,
    sodium.crypto_pwhash_OPSLIMIT_MIN,
    sodium.crypto_pwhash_MEMLIMIT_MIN
  );

  return hash;
}

export function verifyPassword(password, hash) {
  try {
    return sodium.crypto_pwhash_str_verify(hash, password);
  } catch {
    return false;
  }
}

export function generateReferralCode(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = sodium.randombytes_buf(length);
  return Array.from(bytes).map(b => chars[b % chars.length]).join('');
}
