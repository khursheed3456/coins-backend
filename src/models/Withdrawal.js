import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Withdrawal = sequelize.define('Withdrawal', {
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
  receiverName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  receiverNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  amount: {
    type: DataTypes.DECIMAL(18, 2),
    allowNull: false,
  },
  withdrawalType: {
    type: DataTypes.ENUM('referral', 'deposit'),
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
}, {
  tableName: 'withdrawals',
  timestamps: true,
});

export default Withdrawal;
