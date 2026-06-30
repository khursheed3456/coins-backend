import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Deposit = sequelize.define('Deposit', {
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
  method: {
    type: DataTypes.ENUM('jazzcash', 'easypaisa'),
    allowNull: false,
  },
  senderName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  senderNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending',
  },
  adminNote: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  processedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  isFirstDeposit: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  referralBonusPaid: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'deposits',
  timestamps: true,
});

export default Deposit;
