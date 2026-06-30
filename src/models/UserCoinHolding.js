import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const UserCoinHolding = sequelize.define('UserCoinHolding', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  coinId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'coins', key: 'id' },
  },
  amount: {
    type: DataTypes.DECIMAL(18, 8),
    defaultValue: 0,
  },
  avgBuyPrice: {
    type: DataTypes.DECIMAL(18, 8),
    defaultValue: 0,
  },
}, {
  tableName: 'user_coin_holdings',
  timestamps: true,
});

export default UserCoinHolding;
