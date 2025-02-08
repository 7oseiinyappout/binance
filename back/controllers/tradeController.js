const tradeService = require('../services/tradeService');
const client = require('../config/binance');

exports.buy = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const order = await tradeService.placeOrder(symbol, 'BUY', quantity);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.sell = async (req, res) => {
  try {
    const { symbol, quantity } = req.body;
    const order = await tradeService.placeOrder(symbol, 'SELL', quantity);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.convertCurrency = async (req, res) => {
  try {
    const { fromSymbol, toSymbol, amount } = req.body;

    // تنفيذ التحويل
    const response = await client.universalTransfer({
        type: 'MAIN_UMFUTURE', // نوع التحويل (تعديل حسب الحاجة)
        asset: fromSymbol,
        amount: amount,
      });

    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.getBalance = async (req, res) => {
  try {
    // 🔹 جلب بيانات الحساب
    const accountInfo = await client.accountInfo();
    const balances = accountInfo.balances.filter(b => parseFloat(b.free) > 0);
    
    // 🔹 جلب أسعار العملات من Binance
    const prices = await client.prices();

    let totalUSDT = 0;
    let freeUSDT = 0;

    // 🔹 حساب إجمالي الرصيد بالدولار + نسبة المكسب والخسارة
    const formattedBalances = balances.map(balance => {
      const asset = balance.asset;
      const free = parseFloat(balance.free);
      const price = prices[`${asset}USDT`] ? parseFloat(prices[`${asset}USDT`]) : 1;
      
      const valueInUSDT = free * price;
      totalUSDT += valueInUSDT;

      if (asset === "USDT") {
        freeUSDT = free;
      }

      // 🔹 حساب نسبة المكسب/الخسارة (مثال: إذا اشترينا بسعر 50 والآن 55 => 10%)
      const purchasePrice = 50; // 👈 هنا يفترض استبداله بسعر الشراء الفعلي من الـ DB
      const profitLossPercent = purchasePrice ? ((price - purchasePrice) / purchasePrice) * 100 : 0;

      return {
        asset,
        free: free.toFixed(6),
        valueInUSDT: valueInUSDT.toFixed(2),
        profitLossPercent: profitLossPercent.toFixed(2),
      };
    });

    res.json({
      balances: formattedBalances,
      totalUSDT: totalUSDT.toFixed(2),
      freeUSDT: freeUSDT.toFixed(2),
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.placeOrder = async (req, res) => {
  try {
    const { symbol, side } = req.body;

    // جلب بيانات الحساب
    const accountInfo = await client.accountInfo();
    const balances = accountInfo.balances;
    
    let freeBalance = 0;
    let asset = symbol;
    
    if (side === "BUY") {
      // إذا كان شراء، نستخدم رصيد USDT المتاح
      const usdtBalance = balances.find((b) => b.asset === "USDT");
      freeBalance = parseFloat(usdtBalance.free);
      asset = "USDT";
    } else {
      // إذا كان بيع، نستخدم رصيد العملة نفسها
      const assetBalance = balances.find((b) => b.asset === symbol);
      if (!assetBalance) return res.status(400).json({ error: "Asset not found in your account" });
      freeBalance = parseFloat(assetBalance.free);
    }

    if (freeBalance <= 0) {
      return res.status(400).json({ error: `Insufficient ${asset} balance` });
    }

    // جلب سعر العملة
    const priceData = await client.prices({ symbol: `${symbol}USDT` });
    const price = parseFloat(priceData[`${symbol}USDT`]);

    if (!price || price <= 0) {
      return res.status(400).json({ error: "Invalid price data" });
    }

    // جلب معلومات التداول للرمز
    const exchangeInfo = await client.exchangeInfo();
    const symbolInfo = exchangeInfo.symbols.find((s) => s.symbol === `${symbol}USDT`);
    const lotSizeFilter = symbolInfo.filters.find((f) => f.filterType === "LOT_SIZE");

    const minQty = parseFloat(lotSizeFilter.minQty);
    const stepSize = parseFloat(lotSizeFilter.stepSize);

    // حساب الكمية بناءً على نوع الطلب
    let quantity;
    if (side === "BUY") {
      quantity = freeBalance / price;
    } else {
      quantity = freeBalance;
    }

    // تعديل الكمية لتناسب قوانين Binance
    quantity = (Math.floor(quantity / stepSize) * stepSize).toFixed(8);

    if (quantity < minQty) {
      return res.status(400).json({ error: `Minimum order quantity is ${minQty}` });
    }

    // تنفيذ الطلب
    const order = await client.order({
      symbol: `${symbol}USDT`,
      side,
      quantity,
      type: "MARKET",
    });

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// ✅ API لجلب أسعار العملات ونسبة التغيير خلال 24 ساعة
exports.getMarketData = async (req, res) => {
  try {
    const tickerData = await client.dailyStats(); // 🔹 جلب بيانات التداول خلال 24 ساعة
    const prices = await client.prices(); // 🔹 جلب الأسعار الحالية

    const formattedData = Object.keys(prices).map((symbol) => {
      const ticker = tickerData.find((t) => t.symbol === symbol);
      return {
        asset: symbol.replace("USDT", ""), // 🔹 إزالة "USDT" من الاسم
        lastPrice: parseFloat(prices[symbol]).toFixed(6), // 🔹 السعر الأخير
        changePercent: ticker ? parseFloat(ticker.priceChangePercent).toFixed(2) : "0.00", // 🔹 نسبة التغيير
      };
    });

    res.json({ marketData: formattedData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

