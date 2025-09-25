const { sequelize, syncDatabase } = require('../src/models');

// Database migration script
const migrate = async () => {
  try {
    console.log('🔄 Starting database migration...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Sync all models (create tables)
    await syncDatabase();
    console.log('✅ Database migration completed successfully');
    
    // Close connection
    await sequelize.close();
    console.log('🔌 Database connection closed');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Run migration if called directly
if (require.main === module) {
  migrate();
}

module.exports = migrate;
