"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Phone, Globe, Star, Car, Navigation } from "lucide-react";

export default function Contact() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="contact" className="py-20 lg:py-28 bg-white" ref={ref}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-brand font-semibold text-sm tracking-[0.2em] uppercase">
            Get in Touch
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold text-charcoal mt-2 mb-4"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Find Us
            <span className="text-brand">.</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Info */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="bg-cream rounded-2xl p-6 flex items-start gap-4 group hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20 transition-colors">
                <MapPin className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal mb-1">Address</h3>
                <p className="text-warm-gray">
                  9/226 Great South Road<br />
                  Takanini, Auckland 2112<br />
                  New Zealand
                </p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Alenna+Cafe+Takanini+226+Great+South+Road"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-brand font-medium text-sm mt-2 hover:text-brand-dark transition-colors"
                >
                  <Navigation className="w-3 h-3" /> Get Directions
                </a>
              </div>
            </div>

            <div className="bg-cream rounded-2xl p-6 flex items-start gap-4 group hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20 transition-colors">
                <Phone className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal mb-1">Phone</h3>
                <a
                  href="tel:+6492992916"
                  className="text-warm-gray hover:text-brand transition-colors text-lg"
                >
                  +64 9 299 2916
                </a>
                <p className="text-sm text-warm-gray mt-1">Call us to place an order or ask a question</p>
              </div>
            </div>

            <div className="bg-cream rounded-2xl p-6 flex items-start gap-4 group hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-brand/10 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-brand/20 transition-colors">
                <Globe className="w-6 h-6 text-brand" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal mb-1">Social</h3>
                <a
                  href="https://www.facebook.com/alennacafe"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand hover:text-brand-dark transition-colors font-medium"
                >
                  Facebook – Alenna Cafe
                </a>
                <p className="text-sm text-warm-gray mt-1">Follow us for daily specials and updates!</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-cream rounded-2xl p-5 text-center">
                <Car className="w-6 h-6 text-brand mx-auto mb-2" />
                <p className="font-semibold text-sm text-charcoal">Free Parking</p>
                <p className="text-xs text-warm-gray">Lot + Street</p>
              </div>
              <div className="bg-cream rounded-2xl p-5 text-center">
                <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
                <p className="font-semibold text-sm text-charcoal">4.9 Stars</p>
                <p className="text-xs text-warm-gray">46 Reviews</p>
              </div>
            </div>
          </motion.div>

          {/* Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rounded-2xl overflow-hidden shadow-xl h-[500px]"
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3193.8!2d174.9!3d-37.05!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6d0d4b8e5c5c5c5d%3A0x5c5c5c5c5c5c5c5c!2s226%20Great%20South%20Rd%2C%20Takanini%2C%20Auckland%202112%2C%20New%20Zealand!5e0!3m2!1sen!2snz!4v1700000000000!5m2!1sen!2snz"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Alenna Cafe Location - 226 Great South Road, Takanini"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
