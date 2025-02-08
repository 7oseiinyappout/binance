const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');

router.post('/buy', tradeController.buy);
router.post('/sell', tradeController.sell);
router.post('/convert', tradeController.convertCurrency);
router.get('/balance', tradeController.getBalance);
// router.get('/balance', tradeController.getBalance);
router.post('/order', tradeController.placeOrder);
module.exports = router;
