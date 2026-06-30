import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

let sequelize;

if (process.env.NODE_ENV === 'production') {
  sequelize = new Sequelize(process.env.SUPABASE_DB_URL, {
    dialect: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    process.env.LOCAL_DB_NAME || 'coinx',
    process.env.LOCAL_DB_USER || 'postgres',
    process.env.LOCAL_DB_PASSWORD || 'Shoaib@987',
    {
      host: process.env.LOCAL_DB_HOST || 'localhost',
      port: parseInt(process.env.LOCAL_DB_PORT) || 5432,
      dialect: 'postgres',
      logging: false,
    }
  );
}

export default sequelize;
