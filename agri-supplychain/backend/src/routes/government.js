const express = require('express');
const router = express.Router();

const mockGovtEmployees = [
  {
    id: 'govt-1',
    employeeCode: 'GE25AG001001',
    name: 'System Administrator',
    email: 'admin@agri-supply.gov.in',
    role: 'ADMIN',
    department: 'AGRICULTURE'
  }
];

router.get('/employees', (req, res) => {
  res.json({
    success: true,
    data: mockGovtEmployees
  });
});

router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    data: {
      totalFarmers: 250,
      verifiedFarmers: 180,
      pendingVerifications: 70,
      totalCrops: 420,
      totalTransactions: 1250,
      totalAmount: 5675000
    }
  });
});

module.exports = router;