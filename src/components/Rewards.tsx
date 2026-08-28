"use client";

import { useState } from "react";
import { Gift, RotateCcw } from "lucide-react";
import type { CartLine } from "@/lib/cart";
import type { OrderItem } from "@/db/schema";

type RewardsProps = {
  onReorder: (line: Omit<CartLine, "id" | "quantity"> & { quantity?: number }) => void;
};

type LoyaltyOrder = {
  id: number;
  items: OrderItem[];
  totalCents: number;
  status: string;
  pickupTime: string;
  createdAt: string;
};

export default function Rewards({ onReorder }: RewardsProps) {
  const [email, setEmail] = useState("");
  const [points, setPoints] = useState<number | null>(null);
  const [orders, setOrders] = useState<LoyaltyOrder[]>([]);
  const [message, setMessage] = useState("");

  const lookup = async () => {
    const res = await fetch(`/api/loyalty?email=${encodeURIComponent(email)}`);
    const data = await res.json();
    if (!data.customer) {
      setPoints(0);
      setOrders([]);
      setMessage("No rewards account yet. Place a prepaid order to start earning 1 point per dollar.");
      return;
    }
    setPoints(data.customer.points);
    setOrders(data.orders || []);
    setMessage(`${data.customer.name} has ${data.customer.orderCount} prepaid orders.`);
  };

  return (
    <section id="rewards" className="bg-teal py-20 text-white">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-8 text-center">
          <Gift className="mx-auto mb-3 h-8 w-8 text-brand" />
          <h2 className="text-4xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Alenna Rewards</h2>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">
            Earn 1 point for every prepaid dollar. Redeem 100 points for $5 off. Look up your balance and reorder favourites.
          </p>
        </div>
        <div className="rounded-3xl bg-white p-6 text-charcoal shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              className="flex-1 rounded-xl border px-4 py-3"
            />
            <button onClick={lookup} className="rounded-xl bg-teal px-6 py-3 font-semibold text-brand">
              Check rewards
            </button>
          </div>
          {points !== null && (
            <div className="mt-6">
              <p className="text-3xl font-bold text-teal">{points} pts</p>
              <p className="text-sm text-warm-gray">{message}</p>
              <div className="mt-4 space-y-3">
                {orders.slice(0, 4).map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-2xl bg-cream p-4">
                    <div>
                      <p className="font-semibold text-teal">Order #{order.id} · {order.status}</p>
                      <p className="text-xs text-warm-gray">{order.items.map((item) => item.name).join(", ")}</p>
                    </div>
                    <button
                      onClick={() => {
                        order.items.forEach((item) =>
                          onReorder({
                            menuItemId: item.menuItemId,
                            name: item.name,
                            price: item.price,
                            modifiers: item.modifiers || [],
                            quantity: item.quantity,
                          }),
                        );
                      }}
                      className="flex items-center gap-1 rounded-full bg-teal px-3 py-2 text-xs font-bold text-brand"
                    >
                      <RotateCcw className="h-3 w-3" /> Reorder
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
