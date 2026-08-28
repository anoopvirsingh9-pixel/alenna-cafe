"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Sun, Sunset } from "lucide-react";

const hours = [
  { day: "Monday", time: "6:00 AM – 4:00 PM", isWeekend: false },
  { day: "Tuesday", time: "6:00 AM – 4:00 PM", isWeekend: false },
  { day: "Wednesday", time: "6:00 AM – 4:00 PM", isWeekend: false },
  { day: "Thursday", time: "6:00 AM – 4:00 PM", isWeekend: false },
  { day: "Friday", time: "6:00 AM – 4:00 PM", isWeekend: false },
  { day: "Saturday", time: "7:00 AM – 4:00 PM", isWeekend: true },
  { day: "Sunday", time: "7:00 AM – 4:00 PM", isWeekend: true },
];

export default function Hours() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const now = new Date();
  const currentDay = now.toLocaleDateString("en-NZ", { weekday: "long" });

  return (
    <section className="py-20 lg:py-28 bg-brand-dark text-white relative overflow-hidden" ref={ref}>
      {/* Decorative circles */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-brand-light/20 rounded-full blur-3xl" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-brand-light font-semibold text-sm tracking-[0.2em] uppercase">
            Visit Us
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold mt-2 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Opening Hours
          </h2>
          <p className="text-white/60 text-lg">
            We&apos;re open 7 days a week to serve you the best
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8"
        >
          <div className="space-y-3">
            {hours.map((item, index) => {
              const isToday = item.day === currentDay;
              return (
                <motion.div
                  key={item.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                  className={`flex items-center justify-between py-3 px-4 rounded-xl transition-all ${
                    isToday
                      ? "bg-brand/30 border border-brand-light/30"
                      : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.isWeekend ? (
                      <Sunset className="w-4 h-4 text-brand-light" />
                    ) : (
                      <Sun className="w-4 h-4 text-brand-light" />
                    )}
                    <span className={`font-medium ${isToday ? "text-white" : "text-white/80"}`}>
                      {item.day}
                    </span>
                    {isToday && (
                      <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                        Today
                      </span>
                    )}
                  </div>
                  <span className={`font-semibold ${isToday ? "text-brand-light" : "text-white/70"}`}>
                    {item.time}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
