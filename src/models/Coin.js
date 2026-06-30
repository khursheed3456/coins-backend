import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Coin = sequelize.define('Coin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  symbol: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  totalSupply: {
    type: DataTypes.DECIMAL(30, 8),
    allowNull: false,
  },
  marketCap: {
    type: DataTypes.DECIMAL(30, 2),
    allowNull: false,
  },
  currentPrice: {
    type: DataTypes.DECIMAL(18, 8),
    allowNull: false,
    defaultValue: 0,
  },
  totalBuyVolume: {
    type: DataTypes.DECIMAL(30, 8),
    defaultValue: 0,
  },
  totalSellVolume: {
    type: DataTypes.DECIMAL(30, 8),
    defaultValue: 0,
  },
  priceChange24h: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'coins',
  timestamps: true,
});

export default Coin;
