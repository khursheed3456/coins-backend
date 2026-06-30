import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database.js';
import { hashPassword, generateReferralCode } from '../services/tokenService.js';

import User from '../models/User.js';
import Session from '../models/Session.js';
import Coin from '../models/Coin.js';
import CoinPriceHistory from '../models/CoinPriceHistory.js';
import Trade from '../models/Trade.js';
import UserCoinHolding from '../models/UserCoinHolding.js';
import Deposit from '../models/Deposit.js';
import Withdrawal from '../models/Withdrawal.js';
import OTP from '../models/OTP.js';

User.belongsTo(User, { foreignKey: 'referredBy', as: 'referrer', constraints: false });
User.hasMany(User,   { foreignKey: 'referredBy', as: 'referrals', constraints: false });

async function migrate() {
  try {
    await sequelize.authenticate();
    console.log('✅ DB connected');

    await User.sync({ alter: true });            console.log('  ✓ users');
    await Session.sync({ alter: true });         console.log('  ✓ sessions');
    await OTP.sync({ alter: true });             console.log('  ✓ otps');
    await Coin.sync({ alter: true });            console.log('  ✓ coins');
    await CoinPriceHistory.sync({ alter: true });console.log('  ✓ coin_price_history');
    await Trade.sync({ alter: true });           console.log('  ✓ trades');
    await UserCoinHolding.sync({ alter: true }); console.log('  ✓ user_coin_holdings');
    await Deposit.sync({ alter: true });         console.log('  ✓ deposits');
    await Withdrawal.sync({ alter: true });      console.log('  ✓ withdrawals');

    try {
      await sequelize.query(`
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints
            WHERE constraint_name = 'users_referredby_fk' AND table_name = 'users'
          ) THEN
            ALTER TABLE users ADD CONSTRAINT users_referredby_fk
              FOREIGN KEY ("referredBy") REFERENCES users(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);
      console.log('  ✓ self-ref FK');
    } catch (e) { console.log('  ℹ FK skipped:', e.message); }

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@coinx444.com';
    const adminPass  = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const existing = await User.findOne({ where: { email: adminEmail } });
    if (!existing) {
      await User.create({
        email: adminEmail, passwordHash: hashPassword(adminPass),
        role: 'admin', referralCode: generateReferralCode(), isVerified: true,
      });
      console.log(`✅ Admin: ${adminEmail} / ${adminPass}`);
    } else {
      console.log('ℹ Admin already exists');
    }

    console.log('✅ Migration complete');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}
migrate();
