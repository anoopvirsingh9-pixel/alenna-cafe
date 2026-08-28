"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useInView } from "framer-motion";
import { Plus, X } from "lucide-react";
import { menuCategories, type MenuItem } from "@/lib/menu-data";
import type { CartLine } from "@/lib/cart";
import type { CartModifier, ModifierGroup } from "@/db/schema";

type MenuSectionProps = {
  cart: CartLine[];
  onAddToCart: (line: Omit<CartLine, "id" | "quantity"> & { quantity?: number }) => void;
  onRemoveFromCart: (lineId: string) => void;
};

type LiveItem = MenuItem & { priceCents?: number; available?: boolean; soldOut?: boolean };

export default function MenuSection({ cart, onAddToCart }: MenuSectionProps) {
  const [activeCategory, setActiveCategory] = useState("breakfast");
  const [items, setItems] = useState<LiveItem[]>([]);
  const [selected, setSelected] = useState<LiveItem | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    fetch("/api/menu")
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  const filtered = (items.length ? items : []).filter((item) => item.category === activeCategory);

  const selectedPrice = useMemo(() => {
    if (!selected) return 0;
    const extras = (selected.modifiers || []).reduce((sum, group) => {
      const label = choices[group.id];
      const option = group.options.find((o) => o.label === label);
      return sum + (option?.price || 0);
    }, 0);
    return Number((selected.price + extras).toFixed(2));
  }, [selected, choices]);

  const openItem = (item: LiveItem) => {
    if (item.soldOut || item.available === false) return;
    const initial: Record<string, string> = {};
    (item.modifiers || []).forEach((group) => {
      initial[group.id] = group.options[0]?.label || "";
    });
    setChoices(initial);
    setSelected(item);
  };

  const confirmAdd = () => {
    if (!selected) return;
    const modifiers: CartModifier[] = (selected.modifiers || []).map((group) => {
      const option = group.options.find((o) => o.label === choices[group.id]) || group.options[0];
      return { group: group.name, option: option.label, price: option.price };
    });
    onAddToCart({
      menuItemId: selected.id,
      name: selected.name,
      price: selectedPrice,
      modifiers,
      image: selected.image,
    });
    setSelected(null);
  };

  return (
    <section id="menu" className="bg-cream py-20 lg:py-28" ref={ref}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : {}} className="mb-12 text-center">
          <span className="text-sm font-semibold tracking-[0.2em] text-brand-dark uppercase">Our menu</span>
          <h2 className="mt-2 text-4xl font-bold text-teal sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            Made to order.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-warm-gray">
            Customise eggs, bread, milk, spice and more. GST included. Gluten-free and vegan options available.
          </p>
        </motion.div>

        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {menuCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`rounded-full px-6 py-3 text-sm font-semibold transition ${
                activeCategory === cat.id ? "bg-teal text-brand shadow-lg" : "bg-white text-charcoal hover:bg-brand/20"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item, index) => {
            const qty = cart.filter((c) => c.menuItemId === item.id).reduce((sum, c) => sum + c.quantity, 0);
            const disabled = item.soldOut || item.available === false;
            return (
              <motion.article
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="menu-card overflow-hidden rounded-2xl bg-white shadow-md"
              >
                <div className="relative h-48 overflow-hidden">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                  <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                    {(item.tags || []).map((tag) => (
                      <span key={tag} className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-teal">
                        {tag}
                      </span>
                    ))}
                    {disabled && <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-semibold text-white">Sold out</span>}
                  </div>
                  <div className="absolute right-3 bottom-3 rounded-full bg-teal px-3 py-1.5 text-sm font-bold text-brand">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="mb-2 text-lg font-bold text-teal">{item.name}</h3>
                  <p className="mb-4 line-clamp-2 text-sm text-warm-gray">{item.description}</p>
                  <button
                    disabled={disabled}
                    onClick={() => openItem(item)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal py-3 font-semibold text-brand disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-500"
                  >
                    <Plus className="h-4 w-4" />
                    {disabled ? "Unavailable" : qty > 0 ? `Customise & add · ${qty} in cart` : "Customise & add"}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 z-[75] flex items-end justify-center bg-black/50 p-4 sm:items-center">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-teal" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {selected.name}
                  </h3>
                  <p className="mt-1 text-sm text-warm-gray">{selected.description}</p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-cream">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {(selected.modifiers || []).map((group: ModifierGroup) => (
                <div key={group.id} className="mb-4">
                  <p className="mb-2 text-sm font-semibold text-teal">
                    {group.name} {group.required && <span className="text-brand-dark">*</span>}
                  </p>
                  <div className="space-y-2">
                    {group.options.map((option) => (
                      <label
                        key={option.label}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 text-sm ${
                          choices[group.id] === option.label ? "border-teal bg-cream" : "border-zinc-200"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={group.id}
                            checked={choices[group.id] === option.label}
                            onChange={() => setChoices((prev) => ({ ...prev, [group.id]: option.label }))}
                          />
                          {option.label}
                        </span>
                        <span className="text-warm-gray">{option.price === 0 ? "Incl." : option.price > 0 ? `+$${option.price.toFixed(2)}` : `-$${Math.abs(option.price).toFixed(2)}`}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button onClick={confirmAdd} className="mt-2 w-full rounded-xl bg-teal py-3.5 font-bold text-brand">
                Add to order · ${selectedPrice.toFixed(2)}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
