const { sequelize } = require('../config/database');

// Import model functions
const FarmerModel = require('./Farmer');
const GovtEmployeeModel = require('./GovtEmployee');
const CustomerModel = require('./Customer');
const CropModel = require('./Crop');
const TransactionModel = require('./Transaction');

// Initialize models
const Farmer = FarmerModel();
const AgriculturalVerificationOfficer = GovtEmployeeModel();
const Customer = CustomerModel();
const Crop = CropModel();
const Transaction = TransactionModel();

// Define associations
// Farmer associations
Farmer.hasMany(Crop, { foreignKey: 'farmerId', as: 'crops' });
Farmer.hasMany(Transaction, { foreignKey: 'farmerId', as: 'transactions' });

// AgriculturalVerificationOfficer associations
AgriculturalVerificationOfficer.hasMany(Crop, { foreignKey: 'verifiedBy', as: 'verifiedCrops' });
AgriculturalVerificationOfficer.hasMany(Transaction, { foreignKey: 'officerId', as: 'transactions' });

// Customer associations
Customer.hasMany(Transaction, { foreignKey: 'customerId', as: 'transactions' });

// Crop associations
Crop.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });
Crop.belongsTo(AgriculturalVerificationOfficer, { foreignKey: 'verifiedBy', as: 'verifier' });
Crop.hasMany(Transaction, { foreignKey: 'cropId', as: 'transactions' });

// Transaction associations
Transaction.belongsTo(Farmer, { foreignKey: 'farmerId', as: 'farmer' });
Transaction.belongsTo(AgriculturalVerificationOfficer, { foreignKey: 'officerId', as: 'officer' });
Transaction.belongsTo(Customer, { foreignKey: 'customerId', as: 'customer' });
Transaction.belongsTo(Crop, { foreignKey: 'cropId', as: 'crop' });

// Sync database
const syncDatabase = async () => {
  try {
    const dialect = sequelize.getDialect();
    // For MySQL: create/update tables without dropping data
    // For SQLite (dev): keep force true to ensure schema freshness
    const syncOptions = dialect === 'mysql' ? { alter: true } : { force: true };
    await sequelize.sync(syncOptions);
    console.log('✅ Database synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  }
};

module.exports = {
  sequelize,
  Farmer,
  AgriculturalVerificationOfficer,
  Customer,
  Crop,
  Transaction,
  syncDatabase
};
