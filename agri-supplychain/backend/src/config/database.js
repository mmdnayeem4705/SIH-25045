const { Sequelize } = require('sequelize');
const path = require('path');
require('dotenv').config();

// Choose dialect from env; default to mysql. If sqlite is chosen, use local DB file.
const DIALECT = (process.env.DB_DIALECT || 'mysql').toLowerCase();

let sequelize;
if (DIALECT === 'sqlite') {
  // SQLite configuration (dev-friendly)
  const sqliteStorage = process.env.SQLITE_STORAGE || path.resolve(__dirname, '../../database/agri_supplychain.db');
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: sqliteStorage,
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  });
  console.log(`🗄️  Using SQLite at: ${sqliteStorage}`);
} else {
  // MySQL configuration (default)
  sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'agri_supplychain',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    logging: false, // Set to console.log to see SQL queries
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      // mysql2 supports 'charset' here; 'collate' is not a valid connection option
      charset: 'utf8mb4'
    }
  });
}

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, testConnection };
