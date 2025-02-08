require('dotenv').config();
const express = require('express');
const cors = require('cors');

const tradeRoutes = require('./routes/tradeRoutes');
const priceRoutes = require('./routes/priceRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// استخدام المسارات
app.use('/api/trade', tradeRoutes);
app.use('/api/price', priceRoutes);

// التعامل مع الأخطاء
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
