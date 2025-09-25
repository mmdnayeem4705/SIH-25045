const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

module.exports = () => {
  const Crop = sequelize.define('Crop', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    cropCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    farmerId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    cropType: {
      type: DataTypes.ENUM(
        'RICE',
        'WHEAT',
        'CORN',
        'TOMATO',
        'POTATO',
        'ONION',
        'SUGARCANE',
        'COTTON',
        'SOYBEAN',
        'GROUNDNUT',
        'SUNFLOWER',
        'MILLET',
        'BARLEY',
        'OTHERS'
      ),
      allowNull: false
    },
    variety: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
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
    qualityGrade: {
      type: DataTypes.ENUM('A+', 'A', 'B+', 'B', 'C'),
      allowNull: true
    },
    qualityScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 0,
        max: 100
      }
    },
    harvestDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    expiryDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    farmingMethod: {
      type: DataTypes.ENUM('ORGANIC', 'CONVENTIONAL', 'NATURAL'),
      defaultValue: 'CONVENTIONAL'
    },
    certifications: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: [{ type, number, issuedBy, validTill }]
    },
    cropImages: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: [{ url, caption, timestamp }]
    },
    status: {
      type: DataTypes.ENUM(
        'REGISTERED',
        'PENDING_VERIFICATION',
        'VERIFIED',
        'REJECTED',
        'LISTED',
        'PARTIALLY_SOLD',
        'SOLD',
        'EXPIRED'
      ),
      defaultValue: 'REGISTERED'
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    verificationReport: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: { grade, quality, moisture, defects, recommendations }
    },
    ipfsHash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    qrCode: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    basePrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    suggestedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    approvedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    priceApprovedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    priceApprovalDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    marketPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    soldQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00
    },
    remainingQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    location: {
      type: DataTypes.JSON,
      allowNull: false
      // Structure: { farmLocation, collectionCenter, coordinates }
    },
    weatherConditions: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: { temperature, humidity, rainfall, soilMoisture }
    },
    tags: {
      type: DataTypes.JSON,
      allowNull: true
      // Array of tags for better searchability
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    blockchainTxHash: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['cropCode']
      },
      {
        fields: ['farmerId']
      },
      {
        fields: ['cropType']
      },
      {
        fields: ['status']
      },
      {
        fields: ['harvestDate']
      },
      {
        fields: ['verifiedBy']
      }
    ]
  });

  // Class method to generate crop code
  Crop.generateCropCode = function(cropType, district, sequence) {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const cropCode = cropType.substring(0, 3).toUpperCase();
    const districtCode = district.substring(0, 3).toUpperCase();
    const seqNumber = sequence.toString().padStart(4, '0');
    return `CR${year}${month}${cropCode}${districtCode}${seqNumber}`;
  };

  // Instance method to calculate remaining quantity
  Crop.prototype.updateRemainingQuantity = function() {
    this.remainingQuantity = this.quantity - this.soldQuantity;
    return this.save();
  };

  // Instance method to check if crop is available for sale
  Crop.prototype.isAvailableForSale = function() {
    return this.status === 'LISTED' && 
           this.remainingQuantity > 0 && 
           (!this.expiryDate || new Date(this.expiryDate) > new Date()) &&
           this.isActive;
  };

  // Instance method to get crop summary
  Crop.prototype.getSummary = function() {
    return {
      id: this.id,
      cropCode: this.cropCode,
      cropType: this.cropType,
      variety: this.variety,
      quantity: this.quantity,
      unit: this.unit,
      qualityGrade: this.qualityGrade,
      status: this.status,
      approvedPrice: this.approvedPrice,
      remainingQuantity: this.remainingQuantity,
      harvestDate: this.harvestDate,
      location: this.location?.collectionCenter || this.location?.farmLocation
    };
  };

  // Instance method to get traceability data
  Crop.prototype.getTraceabilityData = function() {
    return {
      cropCode: this.cropCode,
      cropType: this.cropType,
      variety: this.variety,
      farmingMethod: this.farmingMethod,
      harvestDate: this.harvestDate,
      qualityGrade: this.qualityGrade,
      verificationReport: this.verificationReport,
      certifications: this.certifications,
      location: this.location,
      weatherConditions: this.weatherConditions,
      ipfsHash: this.ipfsHash,
      blockchainTxHash: this.blockchainTxHash
    };
  };

  return Crop;
};