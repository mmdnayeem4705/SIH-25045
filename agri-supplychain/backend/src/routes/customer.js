const express = require('express');
const router = express.Router();

const mockCustomers = [
  {
    id: 'customer-1',
    customerCode: 'CU25IN001001',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '9876543212',
    totalOrders: 5,
    totalSpent: 12500
  }
];

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: mockCustomers
  });
});

router.get('/marketplace', (req, res) => {
  const mockListings = [
    {
      id: 'listing-1',
      cropCode: 'CR2509WHE001',
      cropType: 'WHEAT',
      variety: 'HD-2967',
      quantity: 500,
      unit: 'KG',
      pricePerKg: 25,
      qualityGrade: 'A+',
      farmerName: 'Ramesh Kumar',
      location: 'Haryana'
    },
    {
      id: 'listing-2',
      cropCode: 'CR2509RIC002',
      cropType: 'RICE',
      variety: 'Basmati-1121',
      quantity: 750,
      unit: 'KG',
      pricePerKg: 45,
      qualityGrade: 'A',
      farmerName: 'Suresh Singh',
      location: 'Punjab'
    }
  ];
  
  res.json({
    success: true,
    data: mockListings
  });
});

module.exports = router;