import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Trade = sequelize.define('Trade', {
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
  type: {
    type: DataTypes.ENUM('buy', 'sell'),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
  },
  priceAtTrade: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
  },
  totalValue: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
  },
  profitLoss: {
    type: DataTypes.DECIMAL(18, 8),
    defaultValue: 0,
  },
}, {
  tableName: 'trades',
  timestamps: true,
});

export default Trade;
