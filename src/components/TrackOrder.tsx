"use client";

import { useState } from "react";
import { Coffee, Search, Check, Star, ArrowRight, Shield } from "lucide-react";

export default function TrackOrder() {
  const [query, setQuery] = useState("");
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Order not found");
      } else {
        setOrder(data.order);
      }
    } catch {
      setError("Failed to fetch order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="track" className="py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <span className="text-brand font-semibold text-sm tracking-[0.2em] uppercase">Order Tracker</span>
        <h2 className="text-4xl font-bold text-teal mt-2 mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          Track Your Pickup
        </h2>
        <p className="text-warm-gray mb-8">
          Enter your Order ID (e.g. 1, 2) to check live kitchen status and pickup details.
        </p>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-gray w-4 h-4" />
            <input
              type="text"
              placeholder="Enter Order ID..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-teal text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-teal hover:bg-teal-deep text-brand font-bold px-6 py-3 rounded-xl transition-all text-sm flex items-center gap-2"
          >
            {loading ? "Searching..." : "Track"}
          </button>
        </form>

        {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl max-w-md mx-auto">{error}</p>}

        {order && (
          <div className="bg-cream rounded-3xl p-6 text-left max-w-md mx-auto shadow-lg border border-teal/10 space-y-4">
            <div className="flex justify-between items-center border-b border-teal/10 pb-3">
              <div>
                <span className="text-xs font-bold text-brand uppercase tracking-wider">Order #{order.id}</span>
                <h3 className="font-bold text-teal text-lg">{order.customerName}</h3>
              </div>
              <span className="bg-teal text-brand px-3 py-1 rounded-full text-xs font-bold">{order.status}</span>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-warm-gray">Pickup Slot: <strong className="text-teal">{order.pickupDate || "Today"} at {order.pickupTime}</strong></p>
              <p className="text-warm-gray">Payment: <strong className="text-teal uppercase">{order.paymentStatus} (${(order.totalCents / 100).toFixed(2)})</strong></p>
            </div>

            <div className="border-t border-teal/10 pt-3 space-y-1.5">
              <h4 className="font-bold text-xs uppercase tracking-wider text-warm-gray">Items</h4>
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {order.status === "Ready for Pickup" && (
              <div className="bg-green-100 text-green-800 p-3 rounded-xl text-xs font-bold text-center">
                🎉 Your order is ready! Pick it up at 9/226 Great South Road, Takanini.
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
