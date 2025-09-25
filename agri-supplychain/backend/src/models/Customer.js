const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

module.exports = () => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    customerCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false
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
      allowNull: false,
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
    customerType: {
      type: DataTypes.ENUM('INDIVIDUAL', 'RETAILER', 'WHOLESALER', 'RESTAURANT', 'INSTITUTION'),
      defaultValue: 'INDIVIDUAL'
    },
    businessDetails: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: { businessName, licenseNumber, gstNumber, businessType }
    },
    addresses: {
      type: DataTypes.JSON,
      allowNull: false
      // Structure: [{ street, city, district, state, pincode }]
    },
    paymentMethods: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: [{ type, details, isDefault }]
    },
    preferences: {
      type: DataTypes.JSON,
      defaultValue: {
        organicOnly: false,
        localProduce: false,
        maxDeliveryDistance: 50,
        preferredCrops: [],
        priceRange: { min: 0, max: 1000 }
      }
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    totalSpent: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    loyaltyPoints: {
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
    notificationPreferences: {
      type: DataTypes.JSON,
      defaultValue: {
        email: true,
        sms: true,
        push: true,
        orderUpdates: true,
        priceAlerts: false,
        newProducts: false
      }
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['customerCode']
      },
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['phone']
      },
      {
        unique: true,
        fields: ['aadharNumber']
      },
      {
        fields: ['customerType']
      }
    ]
  });

  // Instance method to validate Aadhar and DOB (robust matching)
  Customer.prototype.validateCredentials = async function(aadharNumber, dateOfBirth) {
    const onlyDigits = (str) => (str || '').toString().replace(/\D/g, '');
    const normalizeDate = (input) => {
      if (!input) return '';
      const s = String(input).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      const m1 = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
      if (m1) {
        const d = m1[1].padStart(2, '0');
        const m = m1[2].padStart(2, '0');
        const y = m1[3];
        return `${y}-${m}-${d}`;
      }
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
  Customer.prototype.getPublicProfile = function() {
    const { paymentMethods, aadharNumber, ...publicData } = this.toJSON();
    return publicData;
  };

  // Class method to generate customer code
  Customer.generateCustomerCode = function(customerType, city, sequence) {
    const year = new Date().getFullYear().toString().slice(-2);
    const typeCode = customerType.substring(0, 2).toUpperCase();
    const cityCode = city.substring(0, 3).toUpperCase();
    const seqNumber = sequence.toString().padStart(4, '0');
    return `CU${year}${typeCode}${cityCode}${seqNumber}`;
  };

  return Customer;
};