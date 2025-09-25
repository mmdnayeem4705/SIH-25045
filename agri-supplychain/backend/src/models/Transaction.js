const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = () => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    transactionId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM(
        'FARMER_TO_GOVT',     // Farmer sells to Government
        'GOVT_TO_CUSTOMER',   // Government sells to Customer
        'REFUND',             // Refund transaction
        'FEE',                // Platform fee
        'BONUS'               // Bonus payment
      ),
      allowNull: false
    },
    cropId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    farmerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    govtEmployeeId: {
      type: DataTypes.UUID,
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    unit: {
      type: DataTypes.ENUM('KG', 'QUINTAL', 'TON', 'BAGS'),
      allowNull: false
    },
    pricePerUnit: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0.01
      }
    },
    platformFee: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    netAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM(
        'PENDING',
        'PROCESSING',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
        'REFUNDED'
      ),
      defaultValue: 'PENDING'
    },
    paymentMethod: {
      type: DataTypes.ENUM('UPI', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CASH'),
      allowNull: false
    },
    paymentDetails: {
      type: DataTypes.JSON,
      allowNull: false
      // Structure: { gateway, reference, upiId, bankAccount, etc. }
    },
    govtTreasuryDetails: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: { account, reference, approvedBy }
    },
    blockchainTxHash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ipfsHash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    initiatedBy: {
      type: DataTypes.ENUM('FARMER', 'CUSTOMER', 'GOVERNMENT', 'SYSTEM'),
      allowNull: false
    },
    approvedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    receipt: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: { receiptNumber, downloadUrl, qrCode }
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true
      // Additional transaction data
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isReconciled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reconciledAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['transactionId']
      },
      {
        fields: ['cropId']
      },
      {
        fields: ['farmerId']
      },
      {
        fields: ['customerId']
      },
      {
        fields: ['type']
      },
      {
        fields: ['status']
      },
      {
        fields: ['createdAt']
      },
      {
        fields: ['blockchainTxHash']
      }
    ]
  });

  // Class method to generate transaction ID
  Transaction.generateTransactionId = function(type) {
    const timestamp = Date.now().toString();
    const typeCode = type.split('_')[0].substring(0, 2).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TXN${typeCode}${timestamp}${random}`;
  };

  // Instance method to calculate net amount
  Transaction.prototype.calculateNetAmount = function() {
    this.netAmount = this.totalAmount - (this.platformFee || 0);
    return this.netAmount;
  };

  // Instance method to get transaction summary
  Transaction.prototype.getSummary = function() {
    return {
      id: this.id,
      transactionId: this.transactionId,
      type: this.type,
      quantity: this.quantity,
      unit: this.unit,
      totalAmount: this.totalAmount,
      netAmount: this.netAmount,
      status: this.status,
      paymentMethod: this.paymentMethod,
      createdAt: this.createdAt,
      completedAt: this.completedAt
    };
  };

  // Instance method to get receipt data
  Transaction.prototype.getReceiptData = function() {
    return {
      transactionId: this.transactionId,
      type: this.type,
      quantity: this.quantity,
      unit: this.unit,
      pricePerUnit: this.pricePerUnit,
      totalAmount: this.totalAmount,
      platformFee: this.platformFee,
      netAmount: this.netAmount,
      paymentMethod: this.paymentMethod,
      status: this.status,
      createdAt: this.createdAt,
      completedAt: this.completedAt,
      blockchainTxHash: this.blockchainTxHash
    };
  };

  // Instance method to mark as completed
  Transaction.prototype.markCompleted = function() {
    this.status = 'COMPLETED';
    this.completedAt = new Date();
    return this.save();
  };

  // Instance method to mark as failed
  Transaction.prototype.markFailed = function(reason) {
    this.status = 'FAILED';
    this.failureReason = reason;
    return this.save();
  };

  // Class method to get transaction statistics
  Transaction.getStats = async function(dateRange) {
    const whereClause = {};
    if (dateRange) {
      whereClause.createdAt = {
        [sequelize.Op.between]: [dateRange.start, dateRange.end]
      };
    }

    const stats = await this.findAll({
      where: whereClause,
      attributes: [
        'type',
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalAmount'],
        [sequelize.fn('AVG', sequelize.col('totalAmount')), 'avgAmount']
      ],
      group: ['type', 'status'],
      raw: true
    });

    return stats;
  };

  return Transaction;
};