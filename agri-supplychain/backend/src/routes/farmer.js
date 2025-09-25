const express = require('express');
const router = express.Router();

// Mock farmer data
const mockFarmers = [
  {
    id: 'farmer-1',
    farmerCode: 'FM25DEL0001',
    name: 'Ramesh Kumar',
    email: 'ramesh@example.com',
    phone: '9876543211',
    verificationStatus: 'VERIFIED',
    totalEarnings: 125000,
    totalTransactions: 15
  },
  {
    id: 'farmer-2', 
    farmerCode: 'FM25DEL0002',
    name: 'Suresh Singh',
    email: 'suresh@example.com',
    phone: '9876543212',
    verificationStatus: 'PENDING',
    totalEarnings: 75000,
    totalTransactions: 8
  }
];

// Get all farmers
router.get('/', async (req, res) => {
  res.json({
    success: true,
    data: mockFarmers,
    count: mockFarmers.length
  });
});

// Get farmer by ID
router.get('/:id', async (req, res) => {
  const farmer = mockFarmers.find(f => f.id === req.params.id);
  
  if (!farmer) {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found'
    });
  }
  
  res.json({
    success: true,
    data: farmer
  });
});

// Create new farmer
router.post('/', async (req, res) => {
  const newFarmer = {
    id: 'farmer-' + Date.now(),
    farmerCode: 'FM25DEL' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
    ...req.body,
    verificationStatus: 'PENDING',
    totalEarnings: 0,
    totalTransactions: 0
  };
  
  mockFarmers.push(newFarmer);
  
  res.status(201).json({
    success: true,
    data: newFarmer,
    message: 'Farmer registered successfully'
  });
});

// Update farmer
router.put('/:id', async (req, res) => {
  const farmerIndex = mockFarmers.findIndex(f => f.id === req.params.id);
  
  if (farmerIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Farmer not found'
    });
  }
  
  mockFarmers[farmerIndex] = { ...mockFarmers[farmerIndex], ...req.body };
  
  res.json({
    success: true,
    data: mockFarmers[farmerIndex],
    message: 'Farmer updated successfully'
  });
});

module.exports = router;