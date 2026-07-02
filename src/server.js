import dotenv from 'dotenv';
dotenv.config();

import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocketPlugin from '@fastify/websocket';
import sequelize from './config/database.js';
import './models/index.js';

import authRoutes from './routes/auth.js';
import coinRoutes from './routes/coins.js';
import financeRoutes from './routes/finance.js';
import portfolioRoutes from './routes/portfolio.js';
import adminRoutes from './routes/admin.js';
import wsPlugin from './plugins/websocket.js';
import { recordAllPricesSnapshot } from './services/priceEngine.js';

const fastify = Fastify({
  logger: true,
  trustProxy: true,
});

// CORS
// await fastify.register(cors, {
//   origin: "*",
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
// });

// await fastify.register(cors, {
//   origin: "*",
//   credentials: false,
// });

await fastify.register(require('@fastify/cors'), {
  origin: true
});

// WebSocket support
await fastify.register(websocketPlugin);

// WS plugin
await fastify.register(wsPlugin);

// API Routes
await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(coinRoutes, { prefix: '/api/coins' });
await fastify.register(financeRoutes, { prefix: '/api/finance' });
await fastify.register(portfolioRoutes, { prefix: '/api/portfolio' });
await fastify.register(adminRoutes, { prefix: '/api/admin' });

// Health check
fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Start server
const start = async () => {
  try {
    await sequelize.authenticate();
    fastify.log.info('✅ Database connected');

    await sequelize.sync({ alter: false }); // Use migrate.js for schema changes
    fastify.log.info('✅ Models synced');

    const port = parseInt(process.env.PORT) || 4000;
    const host = process.env.HOST || '0.0.0.0';
    await fastify.listen({ port, host });
    fastify.log.info(`🚀 Server running on http://${host}:${port}`);

    // Price snapshot every 5 minutes
    setInterval(recordAllPricesSnapshot, 5 * 60 * 1000);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
