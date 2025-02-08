"use client";

import { useState, useEffect } from "react";
import axios from "axios";

export default function Home() {
  const [balances, setBalances] = useState([]);
  const [totalUSDT, setTotalUSDT] = useState(0);
  const [freeUSDT, setFreeUSDT] = useState(0);
  const [loading, setLoading] = useState(false);

  // ✅ دالة لجلب الرصيد من الـ API وتحديث الواجهة
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

  // ✅ تحميل البيانات عند فتح الصفحة
  useEffect(() => {
    fetchBalance();
  }, []);

  // ✅ تنفيذ البيع أو الشراء مع تحديث الرصيد بعد النجاح
  const handleTrade = async (symbol, side) => {
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/trade/order", {
        symbol,
        side,
      });

      // alert(`✅ Order placed successfully: ${response.data.order.orderId}`);

      // 🔄 تحديث الرصيد مباشرة بعد العملية
      await fetchBalance();
    } catch (error) {
      alert(error.response?.data?.error || "❌ Trade failed!");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-4">My Binance Balance</h1>
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-2xl">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 border">Asset</th>
              <th className="p-2 border">Free Balance</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((balance, index) => (
              <tr key={index} className="border">
                <td className="p-2 border">{balance.asset}</td>
                <td className="p-2 border">{parseFloat(balance.free).toFixed(6)}</td>
                <td className="p-2 border">
                  <button
                    className="bg-green-500 text-white px-3 py-1 rounded mr-2 disabled:opacity-50"
                    onClick={() => handleTrade(balance.asset, "BUY")}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Buy 100%"}
                  </button>
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-50"
                    onClick={() => handleTrade(balance.asset, "SELL")}
                    disabled={loading}
                  >
                    {loading ? "Processing..." : "Sell 100%"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 p-4 bg-gray-200 text-lg font-semibold text-center">
          <p>Total USDT: <span className="text-green-600">${totalUSDT.toFixed(2)} USDT</span></p>
          <p>Available USDT: <span className="text-blue-600">${freeUSDT.toFixed(2)} USDT</span></p>
        </div>
      </div>
    </div>
  );
}
