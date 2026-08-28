"use client";

import { useEffect, useState } from "react";
import { Menu, Phone, ShoppingCart, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "@/components/Logo";

type NavbarProps = {
  cartCount: number;
  onCartClick: () => void;
};

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#about", label: "About" },
  { href: "#menu", label: "Menu" },
  { href: "#order", label: "Order" },
  { href: "#rewards", label: "Rewards" },
  { href: "#track", label: "Track" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
        scrolled ? "bg-teal/95 py-2 shadow-lg backdrop-blur-md" : "bg-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#home" className="flex items-center gap-2">
          <Logo size={scrolled ? 42 : 48} />
          <div className="leading-tight">
            <h1 className="font-heading text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
              Alenna
            </h1>
            <p className="text-[10px] tracking-[0.28em] text-brand uppercase">Cafe · Takanini</p>
          </div>
        </a>

        <div className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-medium text-white/85 transition hover:text-brand">
              {link.label}
            </a>
          ))}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={onCartClick}
            className="relative flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-teal-deep"
          >
            <ShoppingCart className="h-4 w-4" />
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {cartCount}
              </span>
            )}
          </motion.button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <button onClick={onCartClick} className="relative rounded-full bg-brand p-2 text-teal-deep">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={() => setMobileOpen((v) => !v)} className="p-2 text-white">
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-teal-deep/95 md:hidden"
          >
            <div className="space-y-2 px-6 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-2 text-white"
                >
                  {link.label}
                </a>
              ))}
              <a href="tel:+6492992916" className="flex items-center gap-2 py-2 text-brand">
                <Phone className="h-4 w-4" /> +64 9 299 2916
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
