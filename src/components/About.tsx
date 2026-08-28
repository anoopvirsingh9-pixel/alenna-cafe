"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Baby, Car, Clock, Leaf, Star, Utensils } from "lucide-react";
import Logo from "@/components/Logo";

const features = [
  { icon: Star, title: "4.9 stars", desc: "Loved by 46+ local reviews" },
  { icon: Clock, title: "Open early", desc: "6am weekdays, 7am weekends" },
  { icon: Car, title: "Free parking", desc: "On-site lot and street parks" },
  { icon: Utensils, title: "Dine-in & pickup", desc: "No delivery — fresh to the counter" },
  { icon: Leaf, title: "Dietary options", desc: "GF swaps, vegan drinks, kids plates" },
  { icon: Baby, title: "Family friendly", desc: "High chairs and a kids menu" },
];

export default function About() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section id="about" className="bg-white py-20 lg:py-28" ref={ref}>
      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={isInView ? { opacity: 1, x: 0 } : {}}>
          <Logo size={88} />
          <span className="mt-6 block text-sm font-semibold tracking-[0.2em] text-brand-dark uppercase">Welcome to</span>
          <h2 className="mt-2 text-4xl font-bold text-teal sm:text-5xl" style={{ fontFamily: "'Playfair Display', serif" }}>
            Alenna Cafe.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-warm-gray">
            In the heart of Takanini, Alenna is known for generous portions and coffee that keeps regulars coming back.
            Breakfast, brunch and lunch are cooked to order — now with prepaid online pickup so you can skip the queue.
          </p>
          <p className="mt-4 text-lg leading-relaxed text-warm-gray">
            Need gluten-free? Swap ciabatta for hash browns. Plant milk, kids options and kitchen notes are built into every order.
          </p>
        </motion.div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl bg-cream p-5 text-center"
            >
              <feature.icon className="mx-auto mb-3 h-6 w-6 text-teal" />
              <h3 className="text-sm font-semibold text-teal">{feature.title}</h3>
              <p className="mt-1 text-xs text-warm-gray">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
