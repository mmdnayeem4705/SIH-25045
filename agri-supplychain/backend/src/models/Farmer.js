const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

module.exports = () => {
  const Farmer = sequelize.define('Farmer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    farmerCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 100]
      }
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 18,
        max: 100
      }
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true
      }
    },
    gender: {
      type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    aadharNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      validate: {
        is: /^\d{12}$/ // 12 digit Aadhar number
      }
    },
    address: {
      type: DataTypes.JSON,
      allowNull: false
      // Structure: { street, village, district, state, pincode }
    },
    farmDetails: {
      type: DataTypes.JSON,
      allowNull: false
      // Structure: { size, cropTypes }
    },
    bankDetails: {
      type: DataTypes.JSON,
      allowNull: false
      // Structure: { bankName, accountNumber, ifscCode }
    },
    upiId: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        is: /^[\w.-]+@[\w.-]+$/ // Basic UPI ID format
      }
    },
    kycStatus: {
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
      defaultValue: 'PENDING'
    },
    kycDocuments: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: { aadharCard, landRecords, bankPassbook }
    },
    verificationStatus: {
      type: DataTypes.ENUM('UNVERIFIED', 'VERIFIED', 'SUSPENDED'),
      defaultValue: 'UNVERIFIED'
    },
    verifiedBy: {
      type: DataTypes.UUID,
      allowNull: true
    },
    verificationDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalEarnings: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00
    },
    totalTransactions: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5
      }
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    preferredLanguage: {
      type: DataTypes.STRING,
      defaultValue: 'hindi',
      allowNull: false
    },
    notificationPreferences: {
      type: DataTypes.JSON,
      defaultValue: {
        sms: true,
        email: false,
        push: true,
        whatsapp: false
      }
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['farmerCode']
      },
      {
        unique: true,
        fields: ['phone']
      },
      {
        unique: true,
        fields: ['aadharNumber']
      }
    ]
  });

  // Instance method to validate Aadhar and DOB (robust matching)
  Farmer.prototype.validateCredentials = async function(aadharNumber, dateOfBirth) {
    const onlyDigits = (str) => (str || '').toString().replace(/\D/g, '');
    const normalizeDate = (input) => {
      if (!input) return '';
      const s = String(input).trim();
      // Already YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      // DD/MM/YYYY or D/M/YYYY
      const m1 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (m1) {
        const d = m1[1].padStart(2, '0');
        const m = m1[2].padStart(2, '0');
        const y = m1[3];
        return `${y}-${m}-${d}`;
      }
      // Try Date parse fallback
      const dt = new Date(s);
      if (!isNaN(dt.getTime())) {
        const y = dt.getFullYear();
        const m = String(dt.getMonth() + 1).padStart(2, '0');
        const d = String(dt.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      return s;
    };

    const providedAadhar = onlyDigits(aadharNumber);
    const storedAadhar = onlyDigits(this.aadharNumber);

    const storedDOB = this.dateOfBirth instanceof Date
      ? this.dateOfBirth.toISOString().split('T')[0]
      : String(this.dateOfBirth).substring(0, 10);

    const providedDOB = normalizeDate(dateOfBirth);

    return storedAadhar === providedAadhar && storedDOB === providedDOB;
  };

  // Instance method to get public profile
  Farmer.prototype.getPublicProfile = function() {
    const { bankDetails, aadharNumber, ...publicData } = this.toJSON();
    return publicData;
  };

  // Class method to generate farmer code
  Farmer.generateFarmerCode = function(district, sequence) {
    const year = new Date().getFullYear().toString().slice(-2);
    const districtCode = district.substring(0, 3).toUpperCase();
    const seqNumber = sequence.toString().padStart(4, '0');
    return `FM${year}${districtCode}${seqNumber}`;
  };

  return Farmer;
};