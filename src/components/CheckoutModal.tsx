"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  ShieldCheck,
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
  const [step, setStep] = useState<"details" | "verify" | "pay" | "processing" | "success">("details");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    pickup: "",
    notes: "",
    promo: "",
    redeem: 0,
    channel: "sms" as "sms" | "email",
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoLabel, setPromoLabel] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [points, setPoints] = useState(0);

  const subtotal = cartSubtotal(cart);
  const redeemValue = form.redeem * 0.05;
  const total = Math.max(0.5, subtotal - discount - redeemValue);

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/slots")
      .then((res) => res.json())
      .then((data) => setSlots(data.slots || []))
      .catch(() => setSlots([]));
  }, [isOpen]);

  const selectedSlot = useMemo(
    () => slots.find((slot) => `${slot.date}|${slot.value}` === form.pickup),
    [slots, form.pickup],
  );

  const destination = form.channel === "email" ? form.email : form.phone;

  const validateDetails = () => {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.email.includes("@")) next.email = "Valid email is required";
    if (form.phone.replace(/\D/g, "").length < 8) next.phone = "Valid phone is required";
    if (!form.pickup) next.pickup = "Choose a pickup slot";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const sendCode = async () => {
    if (!validateDetails()) return;
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", destination, channel: form.channel }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors({ form: data.error || "Could not send code" });
      return;
    }
    setPreview(data.preview);
    setStep("verify");
  };

  const verifyCode = async () => {
    const res = await fetch("/api/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "check", destination, code }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrors({ verification: data.error || "Invalid code" });
      return;
    }
    setErrors({});
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

  const lookupPoints = async () => {
    if (!form.email.includes("@")) return;
    const res = await fetch(`/api/loyalty?email=${encodeURIComponent(form.email)}`);
    const data = await res.json();
    setPoints(data.customer?.points || 0);
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
        redeemPoints: form.redeem,
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
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 16, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-0 left-1/2 z-[100] w-11/12 max-w-md -translate-x-1/2 rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-white shadow-2xl"
          >
            <div className="mb-2 flex items-center justify-between text-[10px] tracking-widest text-zinc-400 uppercase">
              Secure verification preview
              <button onClick={() => setPreview(null)}><X className="h-4 w-4" /></button>
            </div>
            <p className="font-mono text-sm leading-relaxed">{preview}</p>
          </motion.div>
        )}
      </AnimatePresence>

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
              {step === "verify" ? "Verify it's you" : step === "pay" ? "Reserve — pay in store" : "Checkout"}
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

              <label className="block text-sm font-semibold text-teal"><User className="mr-1 inline h-4 w-4" /> Full name</label>
              <input className="w-full rounded-xl border px-4 py-3 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-teal"><Mail className="mr-1 inline h-4 w-4" /> Email</label>
                  <input className="w-full rounded-xl border px-4 py-3 text-sm" value={form.email} onBlur={lookupPoints} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-teal"><Phone className="mr-1 inline h-4 w-4" /> Phone</label>
                  <input className="w-full rounded-xl border px-4 py-3 text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
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

              <div className="flex gap-2">
                <input className="flex-1 rounded-xl border px-4 py-3 text-sm" placeholder="Promo code" value={form.promo} onChange={(e) => setForm({ ...form, promo: e.target.value })} />
                <button onClick={applyPromo} className="rounded-xl bg-cream px-4 text-sm font-semibold text-teal">Apply</button>
              </div>
              {errors.promo && <p className="text-xs text-red-500">{errors.promo}</p>}
              {promoLabel && <p className="text-xs text-green-700">{promoLabel} applied (−${discount.toFixed(2)})</p>}

              {points > 0 && (
                <label className="block text-sm">
                  Redeem loyalty points ({points} available, 1 pt = $0.05)
                  <input
                    type="number"
                    min={0}
                    max={Math.min(points, 200)}
                    className="mt-1 w-full rounded-xl border px-4 py-3"
                    value={form.redeem}
                    onChange={(e) => setForm({ ...form, redeem: Number(e.target.value) })}
                  />
                </label>
              )}

              <label className="block text-sm font-semibold text-teal"><MessageSquare className="mr-1 inline h-4 w-4" /> Kitchen notes</label>
              <textarea className="w-full rounded-xl border px-4 py-3 text-sm" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

              <div className="flex gap-2 text-sm">
                <button onClick={() => setForm({ ...form, channel: "sms" })} className={`flex-1 rounded-xl py-2 ${form.channel === "sms" ? "bg-teal text-brand" : "bg-cream"}`}>SMS code</button>
                <button onClick={() => setForm({ ...form, channel: "email" })} className={`flex-1 rounded-xl py-2 ${form.channel === "email" ? "bg-teal text-brand" : "bg-cream"}`}>Email code</button>
              </div>
            </>
          )}

          {step === "verify" && (
            <div className="space-y-4 py-4 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-teal" />
              <p className="text-sm text-warm-gray">Enter the 6-digit code sent to {destination}.</p>
              {errors.verification && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{errors.verification}</p>}
              <input maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} className="w-full rounded-2xl border py-3 text-center font-mono text-2xl tracking-[0.4em]" placeholder="000000" />
              <div className="flex gap-2">
                <button onClick={() => setStep("details")} className="flex-1 rounded-xl border py-3">Back</button>
                <button onClick={verifyCode} className="flex-1 rounded-xl bg-teal py-3 font-semibold text-brand">Verify</button>
              </div>
            </div>
          )}

          {step === "pay" && (
            <div className="space-y-3">
              {errors.pay && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-600">{errors.pay}</p>}
              <div className="rounded-2xl bg-cream p-4 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                {discount > 0 && <div className="flex justify-between text-green-700"><span>Promo</span><span>−${discount.toFixed(2)}</span></div>}
                {redeemValue > 0 && <div className="flex justify-between text-green-700"><span>Loyalty</span><span>−${redeemValue.toFixed(2)}</span></div>}
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
                <span>Your phone/email is verified with a code so the cafe knows the order is real. No card details needed.</span>
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
            <button onClick={sendCode} className="w-full rounded-xl bg-teal py-4 font-bold text-brand">Send verification code</button>
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
