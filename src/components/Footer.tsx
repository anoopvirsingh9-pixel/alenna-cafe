"use client";

import { ArrowUp } from "lucide-react";
import Logo from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="bg-teal-deep text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-1">
            <Logo size={72} />
            <p className="mt-4 text-sm leading-relaxed text-white/60">
              Neighbourhood cafe in Takanini. Generous portions, excellent coffee, order ahead and pay in store.
            </p>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Visit</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>9/226 Great South Road</li>
              <li>Takanini, Auckland 2112</li>
              <li>
                <a href="tel:+6492992916" className="text-brand hover:text-white">+64 9 299 2916</a>
              </li>
              <li>Mon–Fri 6am–4pm · Sat–Sun 7am–4pm</li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Order</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="#menu" className="hover:text-brand">Menu</a></li>
              <li><a href="#order" className="hover:text-brand">Order online</a></li>
              <li><a href="#rewards" className="hover:text-brand">Rewards</a></li>
              <li><a href="#track" className="hover:text-brand">Track order</a></li>
              <li><a href="/allergens" className="hover:text-brand">Allergen guide</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 font-semibold">Policies</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="/privacy" className="hover:text-brand">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-brand">Terms of Service</a></li>
              <li><a href="/refunds" className="hover:text-brand">Refunds & cancellations</a></li>
              <li>
                <a href="/admin" className="inline-flex items-center gap-2 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-teal-deep">
                  <span className="h-2 w-2 animate-ping rounded-full bg-teal-deep" />
                  Staff dashboard
                </a>
              </li>
            </ul>
          </div>
        </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-sm text-white/40 sm:flex-row">
            <p>© {new Date().getFullYear()} Alenna Cafe Takanini. Prices include GST. Pickup only — no delivery.</p>
            <div className="flex items-center gap-4">
              <a
                href="/api/download"
                download="alenna-cafe.zip"
                className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-bold text-teal-deep hover:bg-brand-light transition-colors"
              >
                 Download full site
              </a>
              <a href="#home" className="flex items-center gap-2 hover:text-brand">
                Back to top <ArrowUp className="h-4 w-4" />
              </a>
            </div>
          </div>
      </div>
    </footer>
  );
}
