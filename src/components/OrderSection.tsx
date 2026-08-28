"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ShoppingBag, Clock, CreditCard, CheckCircle } from "lucide-react";

type OrderSectionProps = {
  cartCount: number;
  onCartClick: () => void;
};

const steps = [
  {
    icon: ShoppingBag,
    step: "1",
    title: "Browse & Add",
    description: "Explore our menu above and add your favourite items to the cart",
  },
  {
    icon: CreditCard,
    step: "2",
    title: "Checkout",
    description: "Fill in your details and choose your pickup time",
  },
  {
    icon: Clock,
    step: "3",
    title: "We Prepare",
    description: "Our chefs start preparing your order fresh when you place it",
  },
  {
    icon: CheckCircle,
    step: "4",
    title: "Pick Up & Enjoy!",
    description: "Swing by at your chosen time. Your order will be ready and waiting!",
  },
];

export default function OrderSection({ cartCount, onCartClick }: OrderSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="order" className="py-20 lg:py-28 bg-cream-dark relative overflow-hidden" ref={ref}>
      {/* Decorative background */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-light via-brand to-brand-dark" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-brand font-semibold text-sm tracking-[0.2em] uppercase">
            Quick & Easy
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold text-charcoal mt-2 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Order Online for Pickup
            <span className="text-brand">.</span>
          </h2>
          <p className="text-warm-gray text-lg max-w-2xl mx-auto">
            Skip the wait! Pre-order your meal online and pick it up fresh from our
            counter. Pre-payment required at the time of ordering.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
              className="bg-white rounded-2xl p-6 text-center relative group hover:shadow-xl transition-all duration-300"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-brand/20" />
              )}
              <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-brand group-hover:text-white transition-all duration-300 relative">
                <step.icon className="w-7 h-7 text-brand group-hover:text-white transition-colors" />
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-brand text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {step.step}
                </span>
              </div>
              <h3 className="font-bold text-charcoal mb-2">{step.title}</h3>
              <p className="text-warm-gray text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center"
        >
          <div className="bg-white rounded-2xl p-8 max-w-xl mx-auto shadow-lg">
            <h3
              className="text-2xl font-bold text-charcoal mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Ready to Order?
            </h3>
            <p className="text-warm-gray mb-6">
              {cartCount > 0
                ? `You have ${cartCount} item${cartCount !== 1 ? "s" : ""} in your cart. Ready to check out?`
                : "Browse our menu above and add items to your cart to get started!"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {cartCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCartClick}
                  className="bg-brand hover:bg-brand-dark text-white font-semibold px-8 py-3 rounded-full transition-colors shadow-lg shadow-brand/20"
                >
                  View Cart ({cartCount})
                </motion.button>
              )}
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="#menu"
                className="border-2 border-brand text-brand hover:bg-brand hover:text-white font-semibold px-8 py-3 rounded-full transition-all"
              >
                Browse Menu
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
