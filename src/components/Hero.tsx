"use client";

import { motion } from "framer-motion";
import { ChevronDown, Clock, MapPin, Star } from "lucide-react";
import Logo from "@/components/Logo";

export default function Hero() {
  return (
    <section id="home" className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.pexels.com/photos/18405036/pexels-photo-18405036.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=1200&w=1920')",
        }}
      />
      <div className="hero-gradient absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-6 flex justify-center">
          <Logo size={132} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm"
        >
          <Star className="h-4 w-4 fill-brand text-brand" />
          4.9 · 46 reviews
          <span className="h-4 w-px bg-white/30" />
          Order ahead · pay in store
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-5 text-5xl leading-tight font-bold text-white sm:text-7xl"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Alenna
          <span className="block text-brand">Cafe</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mb-8 max-w-2xl text-lg text-white/80"
        >
          Generous plates, signature coffee, and a warm Takanini welcome. Order online, pay at the counter, and pick up when it is ready.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a href="#order" className="rounded-full bg-brand px-8 py-4 text-lg font-semibold text-teal-deep shadow-xl">
            Order pickup
          </a>
          <a href="#menu" className="rounded-full border-2 border-white/40 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm">
            View the menu
          </a>
        </motion.div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/70">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> Weekdays from 6am
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" /> 9/226 Great South Rd
          </span>
        </div>
      </div>

      <motion.a
        href="#about"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60"
      >
        <ChevronDown className="h-8 w-8" />
      </motion.a>
    </section>
  );
}
