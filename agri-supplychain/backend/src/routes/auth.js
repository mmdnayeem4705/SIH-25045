const express = require('express');
const jwt = require('jsonwebtoken');
const { Farmer, AgriculturalVerificationOfficer, Customer } = require('../models');
const { Op } = require('sequelize');

const router = express.Router();

// JWT Secret (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to generate JWT token
const generateToken = (user, role) => {
  return jwt.sign(
    { 
      id: user.id, 
      role: role,
      name: user.name,
      email: user.email 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Simple validation - no complex checks needed

// ==================== FARMER AUTHENTICATION ====================

// Farmer Registration
router.post('/farmer/register', async (req, res) => {
  try {
    console.log('Received farmer registration data:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      age,
      dateOfBirth,
      gender,
      email,
      phone,
      aadharNumber,
      address,
      farmDetails,
      bankDetails
    } = req.body;

    // Basic validation for required fields
    if (!name || !aadharNumber || !dateOfBirth || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Name, Aadhar number, date of birth, and phone are required'
      });
    }

    // Normalize inputs
    const normalizedAadhar = String(aadharNumber).replace(/\D/g, '').slice(0, 12);
    const normalizedPhone = String(phone).replace(/\D/g, '').slice(0, 10);
    const normalizedEmail = email && String(email).trim() !== '' ? String(email).trim() : null;

    // Check if farmer already exists by Aadhar only
    const existingFarmer = await Farmer.findOne({
      where: { aadharNumber: normalizedAadhar }
    });

    if (existingFarmer) {
      return res.status(400).json({
        success: false,
        message: 'Farmer with this Aadhar number already exists'
      });
    }

    // Generate farmer code
    const district = address?.district || 'UNK';
    const sequence = await Farmer.count() + 1;
    const farmerCode = Farmer.generateFarmerCode(district, sequence);

    // Create farmer - store whatever data is provided
    const farmer = await Farmer.create({
      farmerCode,
      name,
      age: age || 25,
      dateOfBirth,
      gender: gender || 'MALE',
      email: normalizedEmail, // allow NULL to avoid unique '' conflicts
      phone: normalizedPhone,
      aadharNumber: normalizedAadhar,
      address: address || {},
      farmDetails: farmDetails || {},
      bankDetails: bankDetails || {}
    });

    // Generate token
    const token = generateToken(farmer, 'FARMER');

    res.status(201).json({
      success: true,
      message: 'Farmer registered successfully',
      token,
      user: {
        id: farmer.id,
        farmerCode: farmer.farmerCode,
        name: farmer.name,
        role: 'FARMER'
      }
    });

  } catch (error) {
    console.error('Farmer registration error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${validationErrors}`
      });
    }

    // Handle unique constraint errors (e.g., aadhar, phone, email)
    if (error.name === 'SequelizeUniqueConstraintError') {
      const fields = Object.keys(error.fields || {});
      const fieldMsg = fields.length ? `${fields.join(', ')} already exists` : 'Duplicate value';
      return res.status(400).json({ success: false, message: fieldMsg });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Farmer Login
router.post('/farmer/login', async (req, res) => {
  try {
    let { aadharNumber, dateOfBirth } = req.body;

    if (!aadharNumber || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar number and date of birth are required'
      });
    }

    // Normalize inputs
    aadharNumber = String(aadharNumber).replace(/\D/g, '').slice(0, 12);
    const normalizedDob = (() => {
      try {
        const d = new Date(dateOfBirth);
        if (!isNaN(d)) return d.toISOString().split('T')[0];
      } catch {}
      return String(dateOfBirth);
    })();

    if (process.env.NODE_ENV !== 'production') {
      console.log('Farmer login attempt', { aadharNumber, dateOfBirth, normalizedDob });
    }

    // Find farmer
    const farmer = await Farmer.findOne({ where: { aadharNumber } });

    if (!farmer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (farmer.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    // Validate credentials
    const isValid = await farmer.validateCredentials(aadharNumber, normalizedDob);
    if (process.env.NODE_ENV !== 'production') {
      const storedDOB = farmer.dateOfBirth instanceof Date ? farmer.dateOfBirth.toISOString().split('T')[0] : farmer.dateOfBirth;
      console.log('Farmer login validation', { storedDOB, providedDob: normalizedDob, match: isValid });
    }
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await farmer.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(farmer, 'FARMER');
  
  res.json({
    success: true,
    message: 'Farmer login successful',
      token,
    user: {
        id: farmer.id,
        farmerCode: farmer.farmerCode,
        name: farmer.name,
        role: 'FARMER'
      }
    });

  } catch (error) {
    console.error('Farmer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// ==================== AGRICULTURAL VERIFICATION OFFICER AUTHENTICATION ====================

// Agricultural Verification Officer Registration
router.post('/officer/register', async (req, res) => {
  try {
    console.log('Received officer registration data:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      age,
      dateOfBirth,
      gender,
      email,
      phone,
      aadharNumber,
      role,
      department,
      designation,
      jurisdiction,
      officeAddress,
      qualifications
    } = req.body;

    // Simple validation - just check if required fields exist
    if (!name || !aadharNumber || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Name, Aadhar number, and date of birth are required'
      });
    }

    // Check if officer already exists by Aadhar only
    const existingOfficer = await AgriculturalVerificationOfficer.findOne({
      where: { aadharNumber }
    });

    if (existingOfficer) {
      return res.status(400).json({
        success: false,
        message: 'Officer with this Aadhar number already exists'
      });
    }

    // Generate memo ID
    const district = jurisdiction?.district || 'UNK';
    const sequence = await AgriculturalVerificationOfficer.count() + 1;
    const memoId = AgriculturalVerificationOfficer.generateMemoId(department || 'AGRICULTURE', district, sequence);

    // Create officer - store whatever data is provided
    const officer = await AgriculturalVerificationOfficer.create({
      memoId,
      name,
      age: age || 30,
      dateOfBirth,
      gender: gender || 'MALE',
      email: email || '',
      phone: phone || '',
      aadharNumber,
      role: role || 'FIELD_OFFICER',
      department: department || 'AGRICULTURE',
      designation: designation || 'Officer',
      jurisdiction: jurisdiction || {},
      permissions: {},
      officeAddress: officeAddress || {},
      qualifications: qualifications || {}
    });

    // Generate token
    const token = generateToken(officer, 'AGRICULTURAL_VERIFICATION_OFFICER');

    res.status(201).json({
      success: true,
      message: 'Agricultural Verification Officer registered successfully',
      token,
      user: {
        id: officer.id,
        memoId: officer.memoId,
        name: officer.name,
        role: 'AGRICULTURAL_VERIFICATION_OFFICER',
        designation: officer.designation
      }
    });

  } catch (error) {
    console.error('Officer registration error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${validationErrors}`
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Agricultural Verification Officer Login
router.post('/officer/login', async (req, res) => {
  try {
    let { aadharNumber, dateOfBirth } = req.body;

    if (!aadharNumber || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar number and date of birth are required'
      });
    }

    // Normalize inputs
    aadharNumber = String(aadharNumber).replace(/\D/g, '').slice(0, 12);

    // Find officer by Aadhar
    const officer = await AgriculturalVerificationOfficer.findOne({
      where: { aadharNumber, isActive: true }
    });

    if (!officer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Normalize DOB like farmer login
    const normalizedDob = (() => {
      try {
        const d = new Date(dateOfBirth);
        if (!isNaN(d)) return d.toISOString().split('T')[0];
      } catch {}
      return String(dateOfBirth);
    })();

    // Validate credentials by comparing DOB
    const storedDOB = officer.dateOfBirth instanceof Date
      ? officer.dateOfBirth.toISOString().split('T')[0]
      : String(officer.dateOfBirth).substring(0, 10);
    const isValid = storedDOB === normalizedDob;
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await officer.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(officer, 'AGRICULTURAL_VERIFICATION_OFFICER');
  
  res.json({
    success: true,
      message: 'Agricultural Verification Officer login successful',
      token,
    user: {
        id: officer.id,
        memoId: officer.memoId,
        name: officer.name,
        role: 'AGRICULTURAL_VERIFICATION_OFFICER',
        designation: officer.designation,
        permissions: officer.permissions
      }
    });

  } catch (error) {
    console.error('Officer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// ==================== CUSTOMER AUTHENTICATION ====================

// Customer Registration
router.post('/customer/register', async (req, res) => {
  try {
    console.log('Received customer registration data:', JSON.stringify(req.body, null, 2));
    
    const {
      name,
      age,
      dateOfBirth,
      gender,
      email,
      phone,
      aadharNumber,
      customerType,
      businessDetails,
      addresses,
      paymentMethods
    } = req.body;

    // Simple validation - just check if required fields exist
    if (!name || !aadharNumber || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Name, Aadhar number, and date of birth are required'
      });
    }

    // Check if customer already exists by Aadhar only
    const existingCustomer = await Customer.findOne({
      where: { aadharNumber }
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer with this Aadhar number already exists'
      });
    }

    // Generate customer code
    const city = addresses?.[0]?.city || 'UNK';
    const sequence = await Customer.count() + 1;
    const customerCode = Customer.generateCustomerCode(customerType || 'INDIVIDUAL', city, sequence);

    // Create customer - store whatever data is provided
    const customer = await Customer.create({
      customerCode,
      name,
      age: age || 25,
      dateOfBirth,
      gender: gender || 'MALE',
      email: email || '',
      phone: phone || '',
      aadharNumber,
      customerType: customerType || 'INDIVIDUAL',
      businessDetails: businessDetails || {},
      addresses: addresses || [{}],
      paymentMethods: paymentMethods || []
    });

    // Generate token
    const token = generateToken(customer, 'CUSTOMER');

    res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      token,
      user: {
        id: customer.id,
        customerCode: customer.customerCode,
        name: customer.name,
        role: 'CUSTOMER',
        customerType: customer.customerType
      }
    });

  } catch (error) {
    console.error('Customer registration error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors.map(err => err.message).join(', ');
      return res.status(400).json({
        success: false,
        message: `Validation error: ${validationErrors}`
      });
    }
    
    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// Customer Login
router.post('/customer/login', async (req, res) => {
  try {
    let { aadharNumber, dateOfBirth } = req.body;

    if (!aadharNumber || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Aadhar number and date of birth are required'
      });
    }

    // Normalize inputs
    aadharNumber = String(aadharNumber).replace(/\D/g, '').slice(0, 12);
    const normalizedDob = (() => {
      try {
        const d = new Date(dateOfBirth);
        if (!isNaN(d)) return d.toISOString().split('T')[0];
      } catch {}
      return String(dateOfBirth);
    })();

    if (process.env.NODE_ENV !== 'production') {
      console.log('Customer login attempt', { aadharNumber, dateOfBirth, normalizedDob });
    }

    // Find customer
    const customer = await Customer.findOne({ where: { aadharNumber } });

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (customer.isActive === false) {
      return res.status(403).json({ success: false, message: 'Account is inactive' });
    }

    // Validate credentials
    const isValid = await customer.validateCredentials(aadharNumber, normalizedDob);
    if (process.env.NODE_ENV !== 'production') {
      const storedDOB = customer.dateOfBirth instanceof Date ? customer.dateOfBirth.toISOString().split('T')[0] : customer.dateOfBirth;
      console.log('Customer login validation', { storedDOB, providedDob: normalizedDob, match: isValid });
    }
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    await customer.update({ lastLogin: new Date() });

    // Generate token
    const token = generateToken(customer, 'CUSTOMER');
  
  res.json({
    success: true,
    message: 'Customer login successful',
      token,
    user: {
        id: customer.id,
        customerCode: customer.customerCode,
        name: customer.name,
      role: 'CUSTOMER',
        customerType: customer.customerType
      }
    });

  } catch (error) {
    console.error('Customer login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// ==================== PROFILE ROUTES ====================

// Get current user profile (uses auth middleware)
const { authenticateToken } = require('../middleware/auth');

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    let user;

    switch (role) {
      case 'FARMER':
        user = await Farmer.findByPk(id);
        break;
      case 'AGRICULTURAL_VERIFICATION_OFFICER':
        user = await AgriculturalVerificationOfficer.findByPk(id);
        break;
      case 'CUSTOMER':
        user = await Customer.findByPk(id);
        break;
      default:
        return res.status(401).json({ success: false, message: 'Invalid user role' });
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;