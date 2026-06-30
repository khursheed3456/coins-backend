import { Coin, CoinPriceHistory } from '../models/index.js';
import { Op } from 'sequelize';

// Price adjustment factors
const BUY_PRESSURE_FACTOR = 0.002;  // Each buy increases price by 0.2%
const SELL_PRESSURE_FACTOR = 0.002; // Each sell decreases price by 0.2%

export function calculateNewPrice(currentPrice, buyVolume, sellVolume) {
  const totalVolume = parseFloat(buyVolume) + parseFloat(sellVolume);
  if (totalVolume === 0) return currentPrice;

  const buyRatio = parseFloat(buyVolume) / totalVolume;
  const sellRatio = parseFloat(sellVolume) / totalVolume;

  // Net pressure: positive = buy pressure, negative = sell pressure
  const netPressure = buyRatio - sellRatio;
  const priceChange = currentPrice * netPressure * BUY_PRESSURE_FACTOR * 10;
  const newPrice = Math.max(0.000001, parseFloat(currentPrice) + priceChange);

  return parseFloat(newPrice.toFixed(8));
}

export async function updateCoinPrice(coinId, tradeType, tradeVolume) {
  const coin = await Coin.findByPk(coinId);
  if (!coin) return;

  const oldPrice = parseFloat(coin.currentPrice);

  if (tradeType === 'buy') {
    coin.totalBuyVolume = parseFloat(coin.totalBuyVolume) + parseFloat(tradeVolume);
  } else {
    coin.totalSellVolume = parseFloat(coin.totalSellVolume) + parseFloat(tradeVolume);
  }

  const newPrice = calculateNewPrice(oldPrice, coin.totalBuyVolume, coin.totalSellVolume);
  const priceChange24h = ((newPrice - oldPrice) / oldPrice) * 100;

  coin.currentPrice = newPrice;
  coin.priceChange24h = parseFloat(priceChange24h.toFixed(4));
  await coin.save();

  // Record price history
  await CoinPriceHistory.create({
    coinId,
    price: newPrice,
  });

  return coin;
}

export async function initializeCoinPrice(marketCap, totalSupply) {
  if (!totalSupply || totalSupply === 0) return 0;
  return parseFloat((marketCap / totalSupply).toFixed(8));
}

export async function getCoinPriceHistory(coinId, hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  return await CoinPriceHistory.findAll({
    where: {
      coinId,
      recordedAt: { [Op.gte]: since },
    },
    order: [['recordedAt', 'ASC']],
  });
}

// Cron-style function to record price snapshots every 5 mins
export async function recordAllPricesSnapshot() {
  const coins = await Coin.findAll({ where: { isActive: true } });
  for (const coin of coins) {
    await CoinPriceHistory.create({
      coinId: coin.id,
      price: coin.currentPrice,
    });
  }
}
