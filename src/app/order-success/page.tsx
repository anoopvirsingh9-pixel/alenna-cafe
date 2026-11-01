"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Loader2, XCircle } from "lucide-react";
import Logo from "@/components/Logo";
import type { OrderItem } from "@/db/schema";

type PaidOrder = {
  id: number;
  totalCents: number;
  cardFeeCents?: number;
  status: string;
  paymentStatus: string;
  pickupDate: string;
  pickupTime: string;
  customerName: string;
  items: OrderItem[];
  paymentRef: string | null;
};

export default function OrderSuccessPage() {
  const [order, setOrder] = useState<PaidOrder | null>(null);
  const [state, setState] = useState<"checking" | "paid" | "unpaid" | "error">("checking");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get("session_id");
    if (!sessionId) {
      setState("error");
      setMessage("No payment session found.");
      return;
    }
    fetch(`/api/stripe/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setState("error");
          setMessage(data.error);
          return;
        }
        setOrder(data.order || null);
        setState(data.paid ? "paid" : "unpaid");
      })
      .catch(() => {
        setState("error");
        setMessage("Could not verify the payment. Please contact the cafe.");
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-12">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-lg">
        <div className="mb-6 flex justify-center">
          <Logo size={90} />
        </div>

        {state === "checking" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-teal" />
            <h1 className="mt-4 text-2xl font-bold text-teal" style={{ fontFamily: "'Playfair Display', serif" }}>
              Checking your payment…
            </h1>
            <p className="mt-2 text-sm text-warm-gray">This only takes a moment.</p>
          </>
        )}

        {state === "paid" && order && (
          <>
            <CheckCircle className="mx-auto h-14 w-14 text-green-600" />
            <h1 className="mt-4 text-3xl font-bold text-teal" style={{ fontFamily: "'Playfair Display', serif" }}>
              Order paid — see you soon!
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
              Kia ora {order.customerName}, your payment went through. Order <strong>#{order.id}</strong> is in the
              kitchen queue.
            </p>
            <div className="mt-6 rounded-2xl bg-cream p-4 text-left text-sm">
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-teal" /> Pickup: <strong>{order.pickupDate} at {order.pickupTime}</strong></p>
              <p className="mt-2">Reference: {order.paymentRef}</p>
              <div className="mt-3 border-t border-brand/20 pt-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                {(order.cardFeeCents ?? 0) > 0 && (
                  <div className="mt-2 flex justify-between text-warm-gray">
                    <span>Card processing fee</span>
                    <span>${((order.cardFeeCents ?? 0) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="mt-2 flex justify-between border-t border-brand/20 pt-2 font-bold text-teal">
                  <span>Total paid</span>
                  <span>${((order.totalCents + (order.cardFeeCents ?? 0)) / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-warm-gray">
              Save your order number <strong>#{order.id}</strong> — you can follow it in the &quot;Track Your
              Pickup&quot; section on the website.
            </p>
          </>
        )}

        {state === "unpaid" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-4 text-2xl font-bold text-teal" style={{ fontFamily: "'Playfair Display', serif" }}>
              Payment not completed
            </h1>
            <p className="mt-2 text-sm text-warm-gray">
              The card payment didn&apos;t go through, so the order wasn&apos;t placed. Nothing has been charged.
            </p>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-500" />
            <h1 className="mt-4 text-2xl font-bold text-teal" style={{ fontFamily: "'Playfair Display', serif" }}>
              Something went wrong
            </h1>
            <p className="mt-2 text-sm text-warm-gray">{message || "Please contact the cafe on 09 299 2916."}</p>
          </>
        )}

        <a
          href="/"
          className="mt-8 inline-block rounded-xl bg-teal px-6 py-3 text-sm font-bold text-brand"
        >
          Back to the menu
        </a>
      </div>
    </div>
  );
}
