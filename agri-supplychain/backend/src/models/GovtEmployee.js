const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

module.exports = () => {
  const AgriculturalVerificationOfficer = sequelize.define('AgriculturalVerificationOfficer', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    memoId: {
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
        min: 21,
        max: 65
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
    role: {
      type: DataTypes.ENUM(
        'QUALITY_INSPECTOR',
        'PRICE_APPROVER', 
        'COLLECTION_CENTER_MANAGER',
        'DISTRICT_COORDINATOR',
        'STATE_COORDINATOR',
        'ADMIN'
      ),
      allowNull: false
    },
    department: {
      type: DataTypes.ENUM(
        'AGRICULTURE',
        'HORTICULTURE',
        'FOOD_PROCESSING',
        'COOPERATIVE',
        'MARKETING'
      ),
      allowNull: false
    },
    designation: {
      type: DataTypes.STRING,
      allowNull: false
    },
    jurisdiction: {
      type: DataTypes.JSON,
      allowNull: false
      // Structure: { district, state }
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {
        canVerifyCrops: false,
        canApprovePrices: false,
        canManagePayments: false,
        canAccessReports: false,
        canManageUsers: false,
        canViewTransactions: false
      }
    },
    officeAddress: {
      type: DataTypes.JSON,
      allowNull: false
      // Structure: { street, city, pincode }
    },
    qualifications: {
      type: DataTypes.JSON,
      allowNull: true
      // Structure: { degree, specialization, experience }
    },
    licenseNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true
    },
    profilePicture: {
      type: DataTypes.STRING,
      allowNull: true
    },
    digitalSignature: {
      type: DataTypes.TEXT,
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
    verificationsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    approvalsCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    performanceRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.00,
      validate: {
        min: 0,
        max: 5
      }
    },
    workingHours: {
      type: DataTypes.JSON,
      defaultValue: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '09:00', end: '13:00' },
        sunday: null
      }
    },
    notificationPreferences: {
      type: DataTypes.JSON,
      defaultValue: {
        email: true,
        sms: true,
        push: true,
        urgentOnly: false
      }
    }
  }, {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['memoId']
      },
      {
        unique: true,
        fields: ['email']
      },
      {
        unique: true,
        fields: ['aadharNumber']
      }
    ]
  });

  // Instance method to validate Memo ID and DOB
  AgriculturalVerificationOfficer.prototype.validateCredentials = async function(memoId, dateOfBirth) {
    const storedDOB = this.dateOfBirth instanceof Date ? 
      this.dateOfBirth.toISOString().split('T')[0] : 
      this.dateOfBirth;
    return this.memoId === memoId && storedDOB === dateOfBirth;
  };

  // Instance method to check permissions
  AgriculturalVerificationOfficer.prototype.hasPermission = function(permission) {
    return this.permissions[permission] === true;
  };

  // Instance method to get public profile
  AgriculturalVerificationOfficer.prototype.getPublicProfile = function() {
    const { digitalSignature, aadharNumber, ...publicData } = this.toJSON();
    return publicData;
  };

  // Class method to generate memo ID
  AgriculturalVerificationOfficer.generateMemoId = function(department, district, sequence) {
    const year = new Date().getFullYear().toString().slice(-2);
    const deptCode = department.substring(0, 2).toUpperCase();
    const districtCode = district.substring(0, 3).toUpperCase();
    const seqNumber = sequence.toString().padStart(3, '0');
    return `AVO${year}${deptCode}${districtCode}${seqNumber}`;
  };

  // Class method to get role permissions
  AgriculturalVerificationOfficer.getRolePermissions = function(role) {
    const rolePermissions = {
      'QUALITY_INSPECTOR': {
        canVerifyCrops: true,
        canApprovePrices: false,
        canManagePayments: false,
        canAccessReports: true,
        canManageUsers: false,
        canViewTransactions: true
      },
      'PRICE_APPROVER': {
        canVerifyCrops: true,
        canApprovePrices: true,
        canManagePayments: false,
        canAccessReports: true,
        canManageUsers: false,
        canViewTransactions: true
      },
      'COLLECTION_CENTER_MANAGER': {
        canVerifyCrops: true,
        canApprovePrices: true,
        canManagePayments: true,
        canAccessReports: true,
        canManageUsers: false,
        canViewTransactions: true
      },
      'DISTRICT_COORDINATOR': {
        canVerifyCrops: true,
        canApprovePrices: true,
        canManagePayments: true,
        canAccessReports: true,
        canManageUsers: true,
        canViewTransactions: true
      },
      'STATE_COORDINATOR': {
        canVerifyCrops: true,
        canApprovePrices: true,
        canManagePayments: true,
        canAccessReports: true,
        canManageUsers: true,
        canViewTransactions: true
      },
      'ADMIN': {
        canVerifyCrops: true,
        canApprovePrices: true,
        canManagePayments: true,
        canAccessReports: true,
        canManageUsers: true,
        canViewTransactions: true
      }
    };
    return rolePermissions[role] || {};
  };

  return AgriculturalVerificationOfficer;
};