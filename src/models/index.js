import User from './User.js';
import Session from './Session.js';
import Coin from './Coin.js';
import CoinPriceHistory from './CoinPriceHistory.js';
import Trade from './Trade.js';
import UserCoinHolding from './UserCoinHolding.js';
import Deposit from './Deposit.js';
import Withdrawal from './Withdrawal.js';
import OTP from './OTP.js';

// User <-> Session
User.hasMany(Session, { foreignKey: 'userId', as: 'sessions' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Trade
User.hasMany(Trade, { foreignKey: 'userId', as: 'trades' });
Trade.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Holdings
User.hasMany(UserCoinHolding, { foreignKey: 'userId', as: 'holdings' });
UserCoinHolding.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Deposit
User.hasMany(Deposit, { foreignKey: 'userId', as: 'deposits' });
Deposit.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> Withdrawal
User.hasMany(Withdrawal, { foreignKey: 'userId', as: 'withdrawals' });
Withdrawal.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Self-referential referral — constraints:false prevents FK during sync
User.belongsTo(User, { foreignKey: 'referredBy', as: 'referrer', constraints: false });
User.hasMany(User,   { foreignKey: 'referredBy', as: 'referrals', constraints: false });

// Coin <-> PriceHistory
Coin.hasMany(CoinPriceHistory, { foreignKey: 'coinId', as: 'priceHistory' });
CoinPriceHistory.belongsTo(Coin, { foreignKey: 'coinId', as: 'coin' });

// Coin <-> Trade
Coin.hasMany(Trade, { foreignKey: 'coinId', as: 'trades' });
Trade.belongsTo(Coin, { foreignKey: 'coinId', as: 'coin' });

// Coin <-> Holdings
Coin.hasMany(UserCoinHolding, { foreignKey: 'coinId', as: 'holdings' });
UserCoinHolding.belongsTo(Coin, { foreignKey: 'coinId', as: 'coin' });

export {
  User, Session, Coin, CoinPriceHistory,
  Trade, UserCoinHolding, Deposit, Withdrawal, OTP,
};
