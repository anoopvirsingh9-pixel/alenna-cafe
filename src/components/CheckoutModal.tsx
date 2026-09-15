"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { validateEmail, validatePhone } from "@/lib/validate";
import {
  CheckCircle,
  Clock,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  User,
  X,
} from "lucide-react";
import type { CartLine } from "@/lib/cart";
import { cartSubtotal } from "@/lib/cart";

type Slot = { value: string; label: string; date: string; remaining: number };

type CheckoutModalProps = {
  isOpen: boolean;
  onClose: () => void;
  cart: CartLine[];
  onOrderSuccess: () => void;
};

export default function CheckoutModal({ isOpen, onClose, cart, onOrderSuccess }: CheckoutModalProps) {
  const [step, setStep] = useState<"details" | "pay" | "processing" | "success">("details");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    pickup: "",
    notes: "",
    promo: "",
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [orderingLive, setOrderingLive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discount, setDiscount] = useState(0);
  const [promoLabel, setPromoLabel] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);

  const subtotal = cartSubtotal(cart);
  const total = Math.max(0.5, subtotal - discount);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/slots")
      .then((res) => res.json())
      .then((data) => {
        setSlots(data.slots || []);
        setOrderingLive(data.orderingEnabled !== false);
      })
      .catch(() => setSlots([]));
  }, [isOpen]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => `${slot.date}|${slot.value}` === form.pickup),
    [slots, form.pickup],
  );


  const validateDetails = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    const emailCheck = validateEmail(form.email);
    if (!emailCheck.ok) next.email = emailCheck.error;
    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.ok) next.phone = phoneCheck.error;
    if (!form.pickup) next.pickup = "Choose a pickup slot";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goToSummary = () => {
    if (!validateDetails()) return;
    setStep("pay");
  };

  const applyPromo = async () => {
    const res = await fetch("/api/promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: form.promo, subtotalCents: Math.round(subtotal * 100) }),
    });
    const data = await res.json();
    if (!res.ok) {
      setDiscount(0);
      setPromoLabel("");
      setErrors({ promo: data.error });
      return;
    }
    setDiscount((data.discountCents || 0) / 100);
    setPromoLabel(data.promo?.code || form.promo.toUpperCase());
    setErrors((prev) => ({ ...prev, promo: "" }));
  };

  const pay = async () => {
    if (!selectedSlot) return;
    setStep("processing");
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: form.name,
        customerEmail: form.email,
        customerPhone: form.phone,
        pickupTime: selectedSlot.value,
        pickupDate: selectedSlot.date,
        notes: form.notes,
        promoCode: promoLabel || form.promo,
        method: "instore",
        items: cart.map((item) => ({
          id: item.id,
          menuItemId: item.menuItemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          modifiers: item.modifiers,
        })),
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setStep("pay");
      setErrors({ pay: data.error || "Payment failed" });
      return;
    }
    setOrderId(data.order.id);
    setStep("success");
    setTimeout(onOrderSuccess, 4500);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        >
        <div className="flex items-center justify-between border-b bg-cream px-6 py-5">
          <div>
            <h2 className="text-2xl font-bold text-teal" style={{ fontFamily: "'Playfair Display', serif" }}>
              {step === "pay" ? "Reserve — pay in store" : "Checkout"}
            </h2>
            <p className="text-xs text-warm-gray">Pay at pickup · GST included · card or cash</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-white p-2 shadow-sm"><X className="h-5 w-5" /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {step === "details" && (
            <>
              <div className="rounded-2xl bg-cream p-4 text-sm">
                {cart.map((item) => (
                  <div key={item.id} className="mb-1 flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-brand/20 pt-2 font-bold text-teal">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
              </div>

              {errors.form && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{errors.form}</p>}

              {!orderingLive && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm">
                  <p className="font-bold text-amber-800">Ordering is paused right now</p>
                  <p className="mt-1 text-xs text-amber-700">The kitchen has temporarily switched off online ordering. Please call the cafe on 09 299 2916 or try again later.</p>
                </div>
              )}

              <label className="block text-sm font-semibold text-teal"><User className="mr-1 inline h-4 w-4" /> Full name</label>
              <input className="w-full rounded-xl border px-4 py-3 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-teal"><Mail className="mr-1 inline h-4 w-4" /> Email</label>
                  <input className="w-full rounded-xl border px-4 py-3 text-sm" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-teal"><Phone className="mr-1 inline h-4 w-4" /> Phone</label>
                  <input className="w-full rounded-xl border px-4 py-3 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>
              </div>

              <label className="block text-sm font-semibold text-teal"><Clock className="mr-1 inline h-4 w-4" /> Pickup slot</label>
              <select className="w-full rounded-xl border bg-white px-4 py-3 text-sm" value={form.pickup} onChange={(e) => setForm({ ...form, pickup: e.target.value })}>
                <option value="">Choose a time</option>
                {slots.map((slot) => (
                  <option key={`${slot.date}-${slot.value}`} value={`${slot.date}|${slot.value}`}>
                    {slot.label} · {slot.remaining} left
                  </option>
                ))}
              </select>
              {errors.pickup && <p className="mt-1 text-xs text-red-500">{errors.pickup}</p>}

              <div className="flex gap-2">
                <input className="flex-1 rounded-xl border px-4 py-3 text-sm" placeholder="Promo code" value={form.promo} onChange={(e) => setForm({ ...form, promo: e.target.value })} />
                <button onClick={applyPromo} className="rounded-xl bg-cream px-4 text-sm font-semibold text-teal">Apply</button>
              </div>
              {errors.promo && <p className="text-xs text-red-500">{errors.promo}</p>}
              {promoLabel && <p className="text-xs text-green-700">{promoLabel} applied (−${discount.toFixed(2)})</p>}

              <label className="block text-sm font-semibold text-teal"><MessageSquare className="mr-1 inline h-4 w-4" /> Kitchen notes</label>
              <textarea className="w-full rounded-xl border px-4 py-3 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

            </>
          )}

          {step === "pay" && (
            <div className="space-y-3">
              {errors.pay && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{errors.pay}</p>}
              <div className="rounded-2xl bg-cream p-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-700"><span>Promo</span><span>−${discount.toFixed(2)}</span></div>}
                <div className="mt-2 flex justify-between border-t pt-2 text-lg font-bold text-teal"><span>Total</span><span>${total.toFixed(2)}</span></div>
              </div>

              <div className="rounded-2xl border-2 border-teal/60 bg-teal/5 p-4">
                <p className="text-sm font-bold text-teal">🏪 Pay in store — card or cash</p>
                <p className="mt-1 text-xs leading-relaxed text-warm-gray">
                  Nothing is charged now. Your order goes straight to the kitchen queue — just give your name or order number at the counter and pay <strong>${total.toFixed(2)}</strong> when you pick up (EFTPOS, card or cash).
                </p>
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-cream/60 p-3 text-xs text-warm-gray">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>The cafe uses your phone and email only to contact you about your order. No card details needed.</span>
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="flex flex-col items-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-teal" />
              <p className="mt-4 font-semibold">Taking payment and sending your receipt…</p>
            </div>
          )}

          {step === "success" && (
            <div className="py-10 text-center">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-500" />
              <h3 className="text-2xl font-bold text-teal" style={{ fontFamily: "'Playfair Display', serif" }}>Paid & confirmed</h3>
              <p className="mt-2 text-sm text-warm-gray">Order #{orderId} is in the kitchen queue. Pay at the counter when you collect — and bring your name or phone.</p>
              <p className="mt-1 text-xs text-warm-gray">💡 Save your Order ID — <strong>#{orderId}</strong> — you can follow it live in the "Track Your Pickup" section on this page.</p>
            </div>
          )}
        </div>

        {step === "details" && (
          <div className="border-t bg-cream/40 p-6">
            <button onClick={goToSummary} disabled={!orderingLive} className="w-full rounded-xl bg-teal py-4 font-bold text-brand disabled:opacity-50">Continue</button>
          </div>
        )}
        {step === "pay" && (
          <div className="border-t p-6">
            <button onClick={pay} className="w-full rounded-xl bg-teal py-4 font-bold text-brand">Place order — pay ${total.toFixed(2)} in store</button>
          </div>
        )}
        </motion.div>
      </div>
    </>
  );
}
