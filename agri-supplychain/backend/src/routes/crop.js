const express = require('express');
const { Op } = require('sequelize');
const { Crop } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Helpers
const mapQuantityUnitToEnum = (unit) => {
  const u = String(unit || '').toLowerCase();
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return 'KG';
  if (u === 'quintal' || u === 'quintals' || u === 'q') return 'QUINTAL';
  if (u === 'ton' || u === 'tons' || u === 't') return 'TON';
  if (u === 'bags' || u === 'bag') return 'BAGS';
  return 'KG';
};

// List all crops (admin/dev)
router.get('/', async (req, res) => {
  try {
    const crops = await Crop.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: crops });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Create new crop listing (Direct Selling)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      type,
      description,
      quantity,
      quantityUnit,
      pricePerUnit,
      harvestDate,
      lifespan,
      lifespanUnit,
      images
    } = req.body;

    if (!name || !type || !quantity || !pricePerUnit || !harvestDate) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, quantity, price, and harvest date are required'
      });
    }

    const farmerId = req.user.id;

    // Build model-compliant payload
    const cropType = String(type).toUpperCase().includes('VEGETABLE') || String(type).toUpperCase().includes('FRUIT')
      ? 'OTHERS'
      : (String(type).toUpperCase().slice(0, 10) || 'OTHERS');

    const unitEnum = mapQuantityUnitToEnum(quantityUnit);

    // Generate crop code using model method-like logic
    const district = 'GEN';
    const sequence = Date.now() % 10000;
    const yy = new Date().getFullYear().toString().slice(-2);
    const mm = String(new Date().getMonth() + 1).padStart(2, '0');
    const code = `CR${yy}${mm}${(cropType || 'OTH').substring(0,3)}${district}${String(sequence).padStart(4,'0')}`;

    const created = await Crop.create({
      cropCode: code,
      farmerId,
      cropType: cropType,
      variety: name,
      quantity: parseFloat(quantity),
      unit: unitEnum,
      harvestDate,
      status: 'LISTED',
      approvedPrice: parseFloat(pricePerUnit),
      remainingQuantity: parseFloat(quantity),
      cropImages: Array.isArray(images) ? images : [],
      location: { collectionCenter: 'Direct Listing' }
    });

    res.status(201).json({ success: true, data: created, message: 'Crop listed successfully' });
  } catch (error) {
    console.error('Crop listing error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during crop listing' });
  }
});

// Get crops by farmer
router.get('/farmer/:farmerId', authenticateToken, async (req, res) => {
  try {
    const { farmerId } = req.params;
    const crops = await Crop.findAll({ where: { farmerId }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: crops });
  } catch (error) {
    console.error('Error fetching farmer crops:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get all available crops for customers
router.get('/available', async (req, res) => {
  try {
    const crops = await Crop.findAll({
      where: {
        status: 'LISTED',
        isActive: true,
        [Op.or]: [
          { remainingQuantity: { [Op.gt]: 0 } },
          { remainingQuantity: null }
        ]
      },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: crops });
  } catch (error) {
    console.error('Error fetching available crops:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Get crops listed/verified by a specific officer
router.get('/officer/:officerId', authenticateToken, async (req, res) => {
  try {
    const { officerId } = req.params;
    const crops = await Crop.findAll({ where: { verifiedBy: officerId }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: crops });
  } catch (error) {
    console.error('Error fetching officer crops:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;