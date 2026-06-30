import { Trade, UserCoinHolding, Coin, User, Deposit } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { Op } from 'sequelize';

export default async function portfolioRoutes(fastify) {
  // Get user portfolio (holdings)
  fastify.get('/holdings', { preHandler: authenticate }, async (request, reply) => {
    const holdings = await UserCoinHolding.findAll({
      where: { userId: request.user.id },
      include: [{ model: Coin, as: 'coin' }],
    });

    const enriched = holdings.map(h => {
      const currentValue = parseFloat(h.amount) * parseFloat(h.coin.currentPrice);
      const costBasis = parseFloat(h.amount) * parseFloat(h.avgBuyPrice);
      const pnl = currentValue - costBasis;
      const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
      return {
        id: h.id,
        coin: h.coin,
        amount: h.amount,
        avgBuyPrice: h.avgBuyPrice,
        currentValue,
        costBasis,
        pnl,
        pnlPct,
      };
    });

    return reply.send({ holdings: enriched });
  });

  // Get trade history
  fastify.get('/trades', { preHandler: authenticate }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Trade.findAndCountAll({
      where: { userId: request.user.id },
      include: [{ model: Coin, as: 'coin', attributes: ['name', 'symbol', 'imageUrl'] }],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });

    return reply.send({ trades: rows, total: count, page: parseInt(page) });
  });

  // Get referral analytics
  fastify.get('/referrals', { preHandler: authenticate }, async (request, reply) => {
    const user = request.user;

    // All users referred by this user
    const referrals = await User.findAll({
      where: { referredBy: user.id },
      attributes: ['id', 'email', 'hasDeposited', 'createdAt'],
    });

    const totalReferrals = referrals.length;
    const verifiedReferrals = referrals.filter(r => r.hasDeposited).length;
    const unverifiedReferrals = totalReferrals - verifiedReferrals;

    return reply.send({
      referralCode: user.referralCode,
      totalReferrals,
      verifiedReferrals,
      unverifiedReferrals,
      totalEarnings: user.referralEarnings,
      referrals: referrals.map(r => ({
        id: r.id,
        email: r.email.replace(/(.{2}).*(@.*)/, '$1***$2'),
        hasDeposited: r.hasDeposited,
        joinedAt: r.createdAt,
      })),
    });
  });

  // Get dashboard summary
  fastify.get('/summary', { preHandler: authenticate }, async (request, reply) => {
    const user = await User.findByPk(request.user.id);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const recentTrades = await Trade.findAll({
      where: {
        userId: user.id,
        createdAt: { [Op.gte]: yesterday },
      },
      include: [{ model: Coin, as: 'coin', attributes: ['name', 'symbol'] }],
      order: [['createdAt', 'DESC']],
    });

    const totalPnl24h = recentTrades.reduce((sum, t) => sum + parseFloat(t.profitLoss), 0);

    return reply.send({
      balance: user.balance,
      referralEarnings: user.referralEarnings,
      totalPnl24h,
      recentTrades,
    });
  });
}
