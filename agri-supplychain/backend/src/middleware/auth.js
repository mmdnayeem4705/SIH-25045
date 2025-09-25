const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }
    next();
  };
};

// Middleware to check if user is a farmer
const requireFarmer = (req, res, next) => {
  if (!req.user || req.user.role !== 'FARMER') {
    return res.status(403).json({ 
      success: false, 
      message: 'Farmer access required' 
    });
  }
  next();
};

// Middleware to check if user is an agricultural verification officer
const requireOfficer = (req, res, next) => {
  if (!req.user || req.user.role !== 'AGRICULTURAL_VERIFICATION_OFFICER') {
    return res.status(403).json({ 
      success: false, 
      message: 'Agricultural Verification Officer access required' 
    });
  }
  next();
};

// Middleware to check if user is a customer
const requireCustomer = (req, res, next) => {
  if (!req.user || req.user.role !== 'CUSTOMER') {
    return res.status(403).json({ 
      success: false, 
      message: 'Customer access required' 
    });
  }
  next();
};

// Middleware to check if user is either farmer or officer
const requireFarmerOrOfficer = (req, res, next) => {
  if (!req.user || !['FARMER', 'AGRICULTURAL_VERIFICATION_OFFICER'].includes(req.user.role)) {
    return res.status(403).json({ 
      success: false, 
      message: 'Farmer or Agricultural Verification Officer access required' 
    });
  }
  next();
};

module.exports = { 
  authenticateToken, 
  authorizeRole, 
  requireFarmer, 
  requireOfficer, 
  requireCustomer, 
  requireFarmerOrOfficer 
};