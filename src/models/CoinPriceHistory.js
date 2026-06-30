import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const CoinPriceHistory = sequelize.define('CoinPriceHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  coinId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: { model: 'coins', key: 'id' },
  },
  price: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
  },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'coin_price_history',
  timestamps: false,
});

export default CoinPriceHistory;
