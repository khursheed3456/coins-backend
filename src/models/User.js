import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: { isEmail: true },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('user', 'admin'),
    defaultValue: 'user',
  },
  balance: {
    type: DataTypes.DECIMAL(18, 8),
    defaultValue: 0,
  },
  referralCode: {
    type: DataTypes.STRING(12),
    unique: true,
  },
  referredBy: {
    type: DataTypes.UUID,
    allowNull: true,
    // No inline references — self-referential FK is added via associations in models/index.js
    // Using inline references causes "relation does not exist" because the table
    // can't reference itself during CREATE TABLE
  },
  referralBonusClaimed: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  referralEarnings: {
    type: DataTypes.DECIMAL(18, 8),
    defaultValue: 0,
  },
  hasDeposited: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'users',
  timestamps: true,
});

export default User;
