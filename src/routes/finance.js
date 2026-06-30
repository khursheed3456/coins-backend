import { Deposit, Withdrawal, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import sequelize from '../config/database.js';

export default async function financeRoutes(fastify) {
  // Create deposit request
  fastify.post('/deposit', { preHandler: authenticate }, async (request, reply) => {
    const { method, senderName, senderNumber, amount } = request.body;

    if (!method || !senderName || !senderNumber || !amount) {
      return reply.status(400).send({ error: 'All fields are required' });
    }

    if (!['jazzcash', 'easypaisa'].includes(method)) {
      return reply.status(400).send({ error: 'Invalid method' });
    }

    if (parseFloat(amount) < 1000) {
      return reply.status(400).send({ error: 'Minimum deposit is PKR 1000' });
    }

    const user = request.user;
    const isFirstDeposit = !user.hasDeposited;

    const deposit = await Deposit.create({
      userId: user.id,
      method,
      senderName,
      senderNumber,
      amount,
      isFirstDeposit,
    });

    // Notify admin via WebSocket
    if (fastify.adminClients) {
      const msg = JSON.stringify({
        type: 'new_deposit',
        deposit: {
          id: deposit.id,
          userId: user.id,
          email: user.email,
          method,
          senderName,
          senderNumber,
          amount,
          createdAt: deposit.createdAt,
        },
      });
      fastify.adminClients.forEach(client => {
        if (client.readyState === 1) client.send(msg);
      });
    }

    return reply.status(201).send({ message: 'Deposit request submitted', deposit });
  });

  // Get user deposits
  fastify.get('/deposits', { preHandler: authenticate }, async (request, reply) => {
    const deposits = await Deposit.findAll({
      where: { userId: request.user.id },
      order: [['createdAt', 'DESC']],
    });
    return reply.send({ deposits });
  });

  // Create withdrawal request
  fastify.post('/withdraw', { preHandler: authenticate }, async (request, reply) => {
    const { method, receiverName, receiverNumber, amount, withdrawalType } = request.body;

    if (!method || !receiverName || !receiverNumber || !amount || !withdrawalType) {
      return reply.status(400).send({ error: 'All fields are required' });
    }

    if (!['jazzcash', 'easypaisa'].includes(method)) {
      return reply.status(400).send({ error: 'Invalid method' });
    }

    if (parseFloat(amount) < 500) {
      return reply.status(400).send({ error: 'Minimum withdrawal is PKR 500' });
    }

    if (!['referral', 'deposit'].includes(withdrawalType)) {
      return reply.status(400).send({ error: 'Invalid withdrawal type' });
    }

    const user = await User.findByPk(request.user.id);

    // For deposit withdrawal, user must have bought coins
    if (withdrawalType === 'deposit') {
      const hasBought = await sequelize.models.Trade.count({
        where: { userId: user.id, type: 'buy' },
      });
      if (!hasBought) {
        return reply.status(400).send({ error: 'You must buy coins before withdrawing your deposit' });
      }
    }

    // Check referral balance for referral withdrawals
    if (withdrawalType === 'referral') {
      if (parseFloat(user.referralEarnings) < parseFloat(amount)) {
        return reply.status(400).send({ error: 'Insufficient referral earnings' });
      }
    }

    const t = await sequelize.transaction();
    try {
      if (withdrawalType === 'referral') {
        user.referralEarnings = parseFloat(user.referralEarnings) - parseFloat(amount);
        await user.save({ transaction: t });
      }

      const withdrawal = await Withdrawal.create({
        userId: user.id,
        method,
        receiverName,
        receiverNumber,
        amount,
        withdrawalType,
      }, { transaction: t });

      await t.commit();

      // Notify admin via WebSocket
      if (fastify.adminClients) {
        const msg = JSON.stringify({
          type: 'new_withdrawal',
          withdrawal: {
            id: withdrawal.id,
            userId: user.id,
            email: user.email,
            method,
            receiverName,
            receiverNumber,
            amount,
            withdrawalType,
            createdAt: withdrawal.createdAt,
          },
        });
        fastify.adminClients.forEach(client => {
          if (client.readyState === 1) client.send(msg);
        });
      }

      return reply.status(201).send({ message: 'Withdrawal request submitted', withdrawal });
    } catch (err) {
      await t.rollback();
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Withdrawal failed' });
    }
  });

  // Get user withdrawals
  fastify.get('/withdrawals', { preHandler: authenticate }, async (request, reply) => {
    const withdrawals = await Withdrawal.findAll({
      where: { userId: request.user.id },
      order: [['createdAt', 'DESC']],
    });
    return reply.send({ withdrawals });
  });
}
