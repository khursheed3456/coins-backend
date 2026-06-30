import { validateToken } from '../services/tokenService.js';
import { User } from '../models/index.js';

export async function authenticate(request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  const session = await validateToken(token);

  if (!session) {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }

  const user = await User.findByPk(session.userId);
  if (!user || !user.isActive) {
    return reply.status(401).send({ error: 'User not found or inactive' });
  }

  request.user = user;
  request.session = session;
}

export async function requireAdmin(request, reply) {
  await authenticate(request, reply);
  if (reply.sent) return;

  if (request.user.role !== 'admin') {
    return reply.status(403).send({ error: 'Admin access required' });
  }
}
