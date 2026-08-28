"use client";

import { useCallback, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import MenuSection from "@/components/MenuSection";
import OrderSection from "@/components/OrderSection";
import Hours from "@/components/Hours";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CheckoutModal from "@/components/CheckoutModal";
import Rewards from "@/components/Rewards";
import TrackOrder from "@/components/TrackOrder";
import type { CartLine } from "@/lib/cart";
import { sameLine } from "@/lib/cart";

export default function HomePage() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = useCallback((line: Omit<CartLine, "id" | "quantity"> & { quantity?: number }) => {
    setCart((prev) => {
      const existing = prev.find((item) => sameLine(item, line));
      if (existing) {
        return prev.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + (line.quantity || 1) } : item,
        );
      }
      return [
        ...prev,
        {
          ...line,
          id: `${line.menuItemId}-${Date.now()}`,
          quantity: line.quantity || 1,
          modifiers: line.modifiers || [],
        },
      ];
    });
  }, []);

  const handleRemoveFromCart = useCallback((lineId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === lineId);
      if (!existing) return prev;
      if (existing.quantity === 1) return prev.filter((item) => item.id !== lineId);
      return prev.map((item) => (item.id === lineId ? { ...item, quantity: item.quantity - 1 } : item));
    });
  }, []);

  const handleAddById = useCallback((id: string) => {
    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item)));
  }, []);

  return (
    <>
      <Navbar cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <Hero />
      <About />
      <MenuSection cart={cart} onAddToCart={handleAddToCart} onRemoveFromCart={handleRemoveFromCart} />
      <OrderSection cartCount={cartCount} onCartClick={() => setCartOpen(true)} />
      <Rewards onReorder={handleAddToCart} />
      <TrackOrder />
      <Hours />
      <Contact />
      <Footer />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        onAdd={handleAddById}
        onRemove={handleRemoveFromCart}
        onClear={() => setCart([])}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cart={cart}
        onOrderSuccess={() => {
          setCart([]);
          setCheckoutOpen(false);
        }}
      />

      {cartCount > 0 && !cartOpen && !checkoutOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="animate-pulse-glow fixed right-6 bottom-6 z-40 rounded-full bg-teal p-4 text-brand shadow-2xl md:hidden"
        >
          Cart · {cartCount}
        </button>
      )}
    </>
  );
}
