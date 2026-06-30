import { Coin, Trade, UserCoinHolding, User } from '../models/index.js';
import { authenticate } from '../middleware/auth.js';
import { updateCoinPrice, getCoinPriceHistory } from '../services/priceEngine.js';
import sequelize from '../config/database.js';

export default async function coinRoutes(fastify) {
  // List all coins
  fastify.get('/', async (request, reply) => {
    const coins = await Coin.findAll({
      where: { isActive: true },
      order: [['marketCap', 'DESC']],
    });
    return reply.send({ coins });
  });

  // Get single coin with 24h price history
  fastify.get('/:id', async (request, reply) => {
    const coin = await Coin.findByPk(request.params.id);
    if (!coin) return reply.status(404).send({ error: 'Coin not found' });

    const priceHistory = await getCoinPriceHistory(coin.id, 24);
    return reply.send({ coin, priceHistory });
  });

  // Buy coin
  fastify.post('/:id/buy', { preHandler: authenticate }, async (request, reply) => {
    const { amount } = request.body; // amount in PKR
    if (!amount || amount <= 0) {
      return reply.status(400).send({ error: 'Invalid amount' });
    }

    const t = await sequelize.transaction();
    try {
      const coin = await Coin.findByPk(request.params.id, { transaction: t, lock: true });
      if (!coin || !coin.isActive) {
        await t.rollback();
        return reply.status(404).send({ error: 'Coin not found' });
      }

      const user = await User.findByPk(request.user.id, { transaction: t, lock: true });
      if (parseFloat(user.balance) < parseFloat(amount)) {
        await t.rollback();
        return reply.status(400).send({ error: 'Insufficient balance' });
      }

      const coinPrice = parseFloat(coin.currentPrice);
      const coinsReceived = parseFloat(amount) / coinPrice;

      // Deduct balance
      user.balance = parseFloat(user.balance) - parseFloat(amount);
      await user.save({ transaction: t });

      // Create trade
      await Trade.create({
        userId: user.id,
        coinId: coin.id,
        type: 'buy',
        amount: coinsReceived,
        priceAtTrade: coinPrice,
        totalValue: amount,
        profitLoss: 0,
      }, { transaction: t });

      // Update holding
      let holding = await UserCoinHolding.findOne({
        where: { userId: user.id, coinId: coin.id },
        transaction: t,
        lock: true,
      });

      if (holding) {
        const totalCost = parseFloat(holding.avgBuyPrice) * parseFloat(holding.amount) + parseFloat(amount);
        const totalAmount = parseFloat(holding.amount) + coinsReceived;
        holding.avgBuyPrice = totalCost / totalAmount;
        holding.amount = totalAmount;
        await holding.save({ transaction: t });
      } else {
        await UserCoinHolding.create({
          userId: user.id,
          coinId: coin.id,
          amount: coinsReceived,
          avgBuyPrice: coinPrice,
        }, { transaction: t });
      }

      await t.commit();

      // Update price after trade (outside transaction)
      const updatedCoin = await updateCoinPrice(coin.id, 'buy', coinsReceived);

      // Broadcast price update via WebSocket
      if (fastify.websocketServer) {
        const msg = JSON.stringify({ type: 'price_update', coinId: coin.id, price: updatedCoin.currentPrice });
        fastify.websocketServer.clients.forEach(client => {
          if (client.readyState === 1) client.send(msg);
        });
      }

      return reply.send({
        message: 'Buy order executed',
        coinsReceived,
        priceAtTrade: coinPrice,
        totalValue: amount,
        newBalance: user.balance,
      });
    } catch (err) {
      await t.rollback();
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Trade failed' });
    }
  });

  // Sell coin
  fastify.post('/:id/sell', { preHandler: authenticate }, async (request, reply) => {
    const { coinAmount } = request.body; // amount in coins to sell
    if (!coinAmount || coinAmount <= 0) {
      return reply.status(400).send({ error: 'Invalid amount' });
    }

    const t = await sequelize.transaction();
    try {
      const coin = await Coin.findByPk(request.params.id, { transaction: t, lock: true });
      if (!coin || !coin.isActive) {
        await t.rollback();
        return reply.status(404).send({ error: 'Coin not found' });
      }

      const holding = await UserCoinHolding.findOne({
        where: { userId: request.user.id, coinId: coin.id },
        transaction: t,
        lock: true,
      });

      if (!holding || parseFloat(holding.amount) < parseFloat(coinAmount)) {
        await t.rollback();
        return reply.status(400).send({ error: 'Insufficient coin balance' });
      }

      const coinPrice = parseFloat(coin.currentPrice);
      const pkrReceived = parseFloat(coinAmount) * coinPrice;
      const costBasis = parseFloat(holding.avgBuyPrice) * parseFloat(coinAmount);
      const profitLoss = pkrReceived - costBasis;

      // Update holding
      holding.amount = parseFloat(holding.amount) - parseFloat(coinAmount);
      await holding.save({ transaction: t });

      // Credit balance
      const user = await User.findByPk(request.user.id, { transaction: t, lock: true });
      user.balance = parseFloat(user.balance) + pkrReceived;
      await user.save({ transaction: t });

      // Create trade
      await Trade.create({
        userId: user.id,
        coinId: coin.id,
        type: 'sell',
        amount: coinAmount,
        priceAtTrade: coinPrice,
        totalValue: pkrReceived,
        profitLoss,
      }, { transaction: t });

      await t.commit();

      const updatedCoin = await updateCoinPrice(coin.id, 'sell', coinAmount);

      if (fastify.websocketServer) {
        const msg = JSON.stringify({ type: 'price_update', coinId: coin.id, price: updatedCoin.currentPrice });
        fastify.websocketServer.clients.forEach(client => {
          if (client.readyState === 1) client.send(msg);
        });
      }

      return reply.send({
        message: 'Sell order executed',
        pkrReceived,
        priceAtTrade: coinPrice,
        profitLoss,
        newBalance: user.balance,
      });
    } catch (err) {
      await t.rollback();
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Trade failed' });
    }
  });
}
