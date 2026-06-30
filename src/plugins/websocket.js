import fp from 'fastify-plugin';

async function websocketPlugin(fastify) {
  fastify.decorate('adminClients', new Set());
  fastify.decorate('userClients', new Map()); // userId -> Set of ws connections

  fastify.get('/ws/admin', { websocket: true }, async (connection, request) => {
    // Simple token validation from query param
    const { token } = request.query;
    if (!token) {
      connection.socket.close(1008, 'No token');
      return;
    }

    const { validateToken } = await import('../services/tokenService.js');
    const { User } = await import('../models/index.js');

    const session = await validateToken(token);
    if (!session) {
      connection.socket.close(1008, 'Invalid token');
      return;
    }

    const user = await User.findByPk(session.userId);
    if (!user || user.role !== 'admin') {
      connection.socket.close(1008, 'Not admin');
      return;
    }

    fastify.adminClients.add(connection.socket);
    fastify.log.info(`Admin ${user.email} connected via WebSocket`);

    connection.socket.on('close', () => {
      fastify.adminClients.delete(connection.socket);
    });

    connection.socket.send(JSON.stringify({ type: 'connected', message: 'Admin WebSocket connected' }));
  });

  fastify.get('/ws/user', { websocket: true }, async (connection, request) => {
    const { token } = request.query;
    if (!token) {
      connection.socket.close(1008, 'No token');
      return;
    }

    const { validateToken } = await import('../services/tokenService.js');
    const session = await validateToken(token);
    if (!session) {
      connection.socket.close(1008, 'Invalid token');
      return;
    }

    const userId = session.userId;
    if (!fastify.userClients.has(userId)) {
      fastify.userClients.set(userId, new Set());
    }
    fastify.userClients.get(userId).add(connection.socket);

    connection.socket.on('close', () => {
      const clients = fastify.userClients.get(userId);
      if (clients) {
        clients.delete(connection.socket);
        if (clients.size === 0) fastify.userClients.delete(userId);
      }
    });

    connection.socket.send(JSON.stringify({ type: 'connected' }));
  });

  // Public coin price broadcast ws (no auth needed)
  fastify.get('/ws/prices', { websocket: true }, (connection) => {
    if (!fastify.priceClients) fastify.decorate('priceClients', new Set());
    fastify.priceClients.add(connection.socket);

    connection.socket.on('close', () => {
      fastify.priceClients?.delete(connection.socket);
    });

    connection.socket.send(JSON.stringify({ type: 'connected', message: 'Price feed connected' }));
  });
}

export default fp(websocketPlugin, { name: 'websocket-plugin' });
