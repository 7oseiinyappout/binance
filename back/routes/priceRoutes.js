const express = require('express');
const router = express.Router();
const priceController = require('../controllers/priceController');

router.get('/', priceController.getPrice);
router.get('/symbols', priceController.getAllSymbols); // New route for all symbols

module.exports = router;
