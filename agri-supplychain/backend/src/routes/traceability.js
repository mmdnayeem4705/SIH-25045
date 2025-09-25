const express = require('express');
const router = express.Router();

router.get('/qr/:qrCode', (req, res) => {
  res.json({ success: true, data: { qrCode: req.params.qrCode, journey: [] }, message: 'QR code traced' });
});

module.exports = router;