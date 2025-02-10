"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function Home() {
  const [balances, setBalances] = useState([]);
  const [totalUSDT, setTotalUSDT] = useState(0);
  const [freeUSDT, setFreeUSDT] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marketData, setMarketData] = useState([]);
  const [sortBy, setSortBy] = useState("profit");
  const [filteredData, setFilteredData] = useState([]);
  const [autoTrade, setAutoTrade] = useState({});

  const fetchMarketData = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/trade/market");
      setMarketData(response.data.marketData);
      sortData(response.data.marketData, sortBy);
    } catch (error) {
      console.error("Error fetching market data:", error);
    }
  };
  
  const fetchBalance = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/trade/balance");
      setBalances(response.data.balances);
      setTotalUSDT(response.data.totalUSDT);
      setFreeUSDT(response.data.freeUSDT);
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };
  const sortData = (data, criteria) => {
    let sortedData = [...data];

    if (criteria === "profit") {
      sortedData.sort((a, b) => b.changePercent - a.changePercent); // 🔹 الأعلى ربحًا
    } else if (criteria === "loss") {
      sortedData.sort((a, b) => a.changePercent - b.changePercent); // 🔹 الأعلى خسارةً
    } else if (criteria === "new") {
      sortedData.sort(() => Math.random() - 0.5); // 🔹 ترتيب عشوائي
    }

    setFilteredData(sortedData);
  };
  useEffect(() => {
    fetchBalance();
    sortData(marketData, sortBy);
    const interval = setInterval(fetchMarketData, 10000); // 🔹 تحديث البيانات كل 10 ثوانٍ
    return () => clearInterval(interval);
  }, [sortBy, marketData]);

  const handleTrade = async (symbol, side) => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/trade/order", { symbol, side });
      alert(`✅ Order placed successfully: ${response.data.order.orderId}`);
      await fetchBalance();
    } catch (error) {
      alert(error.response?.data?.error || "❌ Trade failed!");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchBalance();
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 10000);
    return () => clearInterval(interval);
  }, [sortBy]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const marketPrices = await axios.get("http://localhost:5000/api/trade/market");
        marketPrices.data.marketData.forEach((data) => {
          if (autoTrade[data.asset]) {
            if (autoTrade[data.asset].buyPrice && data.lastPrice <= autoTrade[data.asset].buyPrice) {
              handleTrade(data.asset, "BUY", autoTrade[data.asset].buyPrice);
            }
            if (autoTrade[data.asset].sellPrice && data.lastPrice >= autoTrade[data.asset].sellPrice) {
              handleTrade(data.asset, "SELL", autoTrade[data.asset].sellPrice);
            }
          }
        });
      } catch (error) {
        console.error("Error checking auto trade conditions:", error);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoTrade]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">My Binance Balance</h1>
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl">
      <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Asset</th>
              <th className="p-2 border">Free Balance</th>
              <th className="p-2 border">Value in USDT</th>
              <th className="p-2 border">Profit/Loss %</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((balance, index) => (
              <tr key={index} className="border">
                <td className="p-2 border">{balance.asset}</td>
                <td className="p-2 border">{balance.free}</td>
                <td className="p-2 border">${balance.valueInUSDT}</td>
                <td className={`p-2 border font-bold ${balance.profitLossPercent >= 0 ? "text-green-500" : "text-red-500"}`}>{balance.profitLossPercent}%</td>
                <td className="p-2 border flex flex-col gap-2">
                  <input type="number" placeholder="Buy Price" className="p-1 border rounded" onChange={(e) => setAutoTrade({ ...autoTrade, [balance.asset]: { ...autoTrade[balance.asset], buyPrice: parseFloat(e.target.value) } })} />
                  <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => handleTrade(balance.asset, "BUY")} disabled={loading}>{loading ? "Processing..." : "Buy 100%"}</button>
                  <input type="number" placeholder="Sell Price" className="p-1 border rounded" onChange={(e) => setAutoTrade({ ...autoTrade, [balance.asset]: { ...autoTrade[balance.asset], sellPrice: parseFloat(e.target.value) } })} />
                  <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={() => handleTrade(balance.asset, "SELL")} disabled={loading}>{loading ? "Processing..." : "Sell 100%"}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 p-4 bg-gray-200 text-lg font-semibold text-center">
          <p>Total USDT: <span className="text-green-600">${totalUSDT} USDT</span></p>
          <p>Available USDT: <span className="text-blue-600">${freeUSDT} USDT</span></p>
        </div>
      </div>

      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">Market Prices</h1>

      {/* 🔹 أزرار التصفية */}
      <div className="mb-4 flex gap-2">
        <button
          className={`px-4 py-2 rounded ${sortBy === "profit" ? "bg-blue-500 text-white" : "bg-gray-300"}`}
          onClick={() => setSortBy("profit")}
        >
          أعلى ربح 📈
        </button>
        <button
          className={`px-4 py-2 rounded ${sortBy === "loss" ? "bg-red-500 text-white" : "bg-gray-300"}`}
          onClick={() => setSortBy("loss")}
        >
          أعلى خسارة 📉
        </button>
        <button
          className={`px-4 py-2 rounded ${sortBy === "new" ? "bg-green-500 text-white" : "bg-gray-300"}`}
          onClick={() => setSortBy("new")}
        >
          الأحدث 🔄
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-3xl">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">العملة</th>
              <th className="p-2 border">السعر الأخير</th>
              <th className="p-2 border">نسبة التغيير (24 ساعة)</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((data, index) => (
              <tr key={index} className="border">
                <td className="p-2 border">{data.asset}</td>
                <td className="p-2 border">${data.lastPrice}</td>
                <td
                  className={`p-2 border font-bold ${
                    data.changePercent >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {data.changePercent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </div>
  );
}
