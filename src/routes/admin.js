import { User, Coin, Deposit, Withdrawal, Trade } from '../models/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { initializeCoinPrice } from '../services/priceEngine.js';
// import { sendDepositNotification, sendWithdrawalNotification } from '../services/emailService.js';
import sequelize from '../config/database.js';
import { hashPassword } from '../services/tokenService.js';
import { Op } from 'sequelize';

export default async function adminRoutes(fastify) {
  // ──────────── COINS ────────────
  fastify.post('/coins', { preHandler: requireAdmin }, async (request, reply) => {
    const { name, symbol, totalSupply, marketCap, imageUrl, description } = request.body;
    if (!name || !symbol || !totalSupply || !marketCap)
      return reply.status(400).send({ error: 'Name, symbol, supply and market cap required' });

    const exists = await Coin.findOne({ where: { symbol: symbol.toUpperCase() } });
    if (exists) return reply.status(400).send({ error: 'Symbol already exists' });

    const initialPrice = await initializeCoinPrice(parseFloat(marketCap), parseFloat(totalSupply));
    const coin = await Coin.create({
      name, symbol: symbol.toUpperCase(), totalSupply, marketCap,
      currentPrice: initialPrice, imageUrl, description,
    });
    return reply.status(201).send({ message: 'Coin created', coin });
  });

  fastify.get('/coins', { preHandler: requireAdmin }, async (request, reply) => {
    const coins = await Coin.findAll({ order: [['createdAt', 'DESC']] });
    return reply.send({ coins });
  });

  fastify.patch('/coins/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const coin = await Coin.findByPk(request.params.id);
    if (!coin) return reply.status(404).send({ error: 'Coin not found' });
    const { name, imageUrl, description, isActive } = request.body;
    if (name) coin.name = name;
    if (imageUrl !== undefined) coin.imageUrl = imageUrl;
    if (description !== undefined) coin.description = description;
    if (isActive !== undefined) coin.isActive = isActive;
    await coin.save();
    return reply.send({ message: 'Coin updated', coin });
  });

  // ──────────── DEPOSITS (HTTP polling) ────────────
  fastify.get('/deposits', { preHandler: requireAdmin }, async (request, reply) => {
    const { status } = request.query;
    const where = status ? { status } : {};
    const deposits = await Deposit.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'email', 'referredBy', 'hasDeposited'] }],
      order: [['createdAt', 'DESC']],
    });
    return reply.send({ deposits });
  });

  fastify.patch('/deposits/:id/approve', { preHandler: requireAdmin }, async (request, reply) => {
    const t = await sequelize.transaction();
    try {
      const deposit = await Deposit.findByPk(request.params.id, { transaction: t, lock: true });
      if (!deposit) { await t.rollback(); return reply.status(404).send({ error: 'Not found' }); }
      if (deposit.status !== 'pending') { await t.rollback(); return reply.status(400).send({ error: 'Already processed' }); }

      const user = await User.findByPk(deposit.userId, { transaction: t, lock: true });
      deposit.status = 'approved';
      deposit.processedAt = new Date();
      await deposit.save({ transaction: t });
      user.balance = parseFloat(user.balance) + parseFloat(deposit.amount);

      if (deposit.isFirstDeposit && !user.hasDeposited && user.referredBy) {
        const referrer = await User.findByPk(user.referredBy, { transaction: t, lock: true });
        if (referrer) {
          referrer.referralEarnings = parseFloat(referrer.referralEarnings) + parseFloat(deposit.amount) * 0.30;
          await referrer.save({ transaction: t });
          deposit.referralBonusPaid = true;
        }
      }
      user.hasDeposited = true;
      await user.save({ transaction: t });
      await deposit.save({ transaction: t });
      await t.commit();
      // await sendDepositNotification(user.email, deposit.amount, 'approved').catch(() => {});
      return reply.send({ message: 'Deposit approved', deposit });
    } catch (err) {
      await t.rollback();
      return reply.status(500).send({ error: 'Failed' });
    }
  });

  fastify.patch('/deposits/:id/reject', { preHandler: requireAdmin }, async (request, reply) => {
    const deposit = await Deposit.findByPk(request.params.id);
    if (!deposit) return reply.status(404).send({ error: 'Not found' });
    if (deposit.status !== 'pending') return reply.status(400).send({ error: 'Already processed' });
    const { adminNote } = request.body;
    deposit.status = 'rejected';
    deposit.adminNote = adminNote;
    deposit.processedAt = new Date();
    await deposit.save();
    const user = await User.findByPk(deposit.userId);
    // await sendDepositNotification(user.email, deposit.amount, 'rejected').catch(() => {});
    return reply.send({ message: 'Deposit rejected' });
  });

  // ──────────── WITHDRAWALS (HTTP polling) ────────────
  fastify.get('/withdrawals', { preHandler: requireAdmin }, async (request, reply) => {
    const { status } = request.query;
    const where = status ? { status } : {};
    const withdrawals = await Withdrawal.findAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
      order: [['createdAt', 'DESC']],
    });
    return reply.send({ withdrawals });
  });

  fastify.patch('/withdrawals/:id/approve', { preHandler: requireAdmin }, async (request, reply) => {
    const withdrawal = await Withdrawal.findByPk(request.params.id);
    if (!withdrawal) return reply.status(404).send({ error: 'Not found' });
    if (withdrawal.status !== 'pending') return reply.status(400).send({ error: 'Already processed' });
    withdrawal.status = 'approved';
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    const user = await User.findByPk(withdrawal.userId);
    // await sendWithdrawalNotification(user.email, withdrawal.amount, 'approved').catch(() => {});
    return reply.send({ message: 'Withdrawal approved' });
  });

  fastify.patch('/withdrawals/:id/reject', { preHandler: requireAdmin }, async (request, reply) => {
    const t = await sequelize.transaction();
    try {
      const withdrawal = await Withdrawal.findByPk(request.params.id, { transaction: t, lock: true });
      if (!withdrawal) { await t.rollback(); return reply.status(404).send({ error: 'Not found' }); }
      if (withdrawal.status !== 'pending') { await t.rollback(); return reply.status(400).send({ error: 'Already processed' }); }
      if (withdrawal.withdrawalType === 'referral') {
        const user = await User.findByPk(withdrawal.userId, { transaction: t, lock: true });
        user.referralEarnings = parseFloat(user.referralEarnings) + parseFloat(withdrawal.amount);
        await user.save({ transaction: t });
      }
      const { adminNote } = request.body;
      withdrawal.status = 'rejected';
      withdrawal.adminNote = adminNote;
      withdrawal.processedAt = new Date();
      await withdrawal.save({ transaction: t });
      await t.commit();
      const user = await User.findByPk(withdrawal.userId);
      // await sendWithdrawalNotification(user.email, withdrawal.amount, 'rejected').catch(() => {});
      return reply.send({ message: 'Withdrawal rejected' });
    } catch (err) {
      await t.rollback();
      return reply.status(500).send({ error: 'Failed' });
    }
  });

  // ──────────── USERS ────────────
  fastify.get('/users', { preHandler: requireAdmin }, async (request, reply) => {
    const { page = 1, limit = 20 } = request.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['passwordHash', 'verificationToken'] },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset,
    });
    return reply.send({ users: rows, total: count });
  });

  fastify.get('/users/:id', { preHandler: requireAdmin }, async (request, reply) => {
    const user = await User.findByPk(request.params.id, {
      attributes: { exclude: ['passwordHash', 'verificationToken'] },
    });
    if (!user) return reply.status(404).send({ error: 'User not found' });
    const deposits = await Deposit.findAll({ where: { userId: user.id }, order: [['createdAt','DESC']], limit: 10 });
    const withdrawals = await Withdrawal.findAll({ where: { userId: user.id }, order: [['createdAt','DESC']], limit: 10 });
    const trades = await Trade.findAll({
      where: { userId: user.id },
      include: [{ model: Coin, as: 'coin', attributes: ['name', 'symbol'] }],
      order: [['createdAt', 'DESC']], limit: 20,
    });
    return reply.send({ user, deposits, withdrawals, trades });
  });

  // ──────────── STATS ────────────
  fastify.get('/stats', { preHandler: requireAdmin }, async (request, reply) => {
    const totalUsers = await User.count({ where: { role: 'user' } });
    const pendingDeposits = await Deposit.count({ where: { status: 'pending' } });
    const pendingWithdrawals = await Withdrawal.count({ where: { status: 'pending' } });
    const totalCoins = await Coin.count({ where: { isActive: true } });
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newUsers24h = await User.count({ where: { createdAt: { [Op.gte]: yesterday }, role: 'user' } });
    return reply.send({ totalUsers, pendingDeposits, pendingWithdrawals, totalCoins, newUsers24h });
  });
}
