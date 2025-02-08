const client = require('../config/binance');

exports.getPrice = async (req, res) => {
  try {
    const { symbol } = req.query;
    const ticker = await client.prices({ symbol });
    res.json({ symbol, price: ticker[symbol] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
};
exports.getAllSymbols = async (req, res) => {
    try {
      const exchangeInfo = await client.exchangeInfo();
      const symbols = exchangeInfo.symbols.map(s => s.symbol);
      res.json({ symbols });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch symbols' });
    }
  };