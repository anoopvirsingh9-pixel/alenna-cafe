"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, Trash2, X } from "lucide-react";
import type { CartLine } from "@/lib/cart";
import { cartSubtotal } from "@/lib/cart";

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  cart: CartLine[];
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
};

export default function CartDrawer({ isOpen, onClose, cart, onAdd, onRemove, onClear, onCheckout }: CartDrawerProps) {
  const total = cartSubtotal(cart);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            className="fixed top-0 right-0 bottom-0 z-[70] flex w-full max-w-md flex-col bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream">
                  <ShoppingBag className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-teal">Your order</h2>
                  <p className="text-sm text-warm-gray">{itemCount} item{itemCount === 1 ? "" : "s"}</p>
                </div>
              </div>
              <button onClick={onClose} className="rounded-full p-2 hover:bg-cream"><X className="h-5 w-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <p className="text-5xl">🛒</p>
                  <h3 className="mt-4 font-semibold">Your cart is empty</h3>
                  <p className="text-sm text-warm-gray">Add breakfast, lunch or coffee to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="rounded-2xl bg-cream p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-semibold text-teal">{item.name}</h4>
                          {item.modifiers.length > 0 && (
                            <p className="mt-1 text-xs text-warm-gray">
                              {item.modifiers.map((mod) => mod.option).join(" · ")}
                            </p>
                          )}
                          <p className="mt-1 text-sm font-bold text-brand-dark">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => onRemove(item.id)} className="h-8 w-8 rounded-lg bg-white shadow-sm">-</button>
                          <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
                          <button onClick={() => onAdd(item.id)} className="h-8 w-8 rounded-lg bg-teal text-brand">+</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button onClick={onClear} className="flex items-center gap-2 text-sm text-red-500">
                    <Trash2 className="h-4 w-4" /> Clear cart
                  </button>
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="space-y-3 border-t p-6">
                <div className="flex items-center justify-between">
                  <span className="text-warm-gray">Subtotal · GST incl.</span>
                  <span className="text-xl font-bold text-teal">${total.toFixed(2)}</span>
                </div>
                <button onClick={onCheckout} className="w-full rounded-xl bg-teal py-4 text-lg font-semibold text-brand">
                  Secure checkout · ${total.toFixed(2)}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
