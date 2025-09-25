const express = require('express');
const router = express.Router();

router.get('/status', (req, res) => {
  res.json({ success: true, data: { connected: false }, message: 'Blockchain status' });
});

module.exports = router;