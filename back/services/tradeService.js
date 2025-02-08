const client = require('../config/binance');

exports.placeOrder = async (symbol, side, quantity) => {
  return await client.order({
    symbol,
    side,
    type: 'MARKET',
    quantity,
  });
};
