"use client";

import Logo from "@/components/Logo";

/**
 * Printable counter standee / poster: big QR that opens the live menu.
 * Press the print button (or Ctrl+P) — styled to fill an A4/A3 sheet.
 */
export default function PosterPage() {
  return (
    <div className="min-h-screen bg-cream p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <a href="/admin" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-teal shadow-sm">← Back to dashboard</a>
          <button
            onClick={() => window.print()}
            className="rounded-xl bg-teal px-5 py-2 text-sm font-bold text-brand shadow-sm"
          >
            🖨️ Print this poster
          </button>
        </div>

        <div className="rounded-3xl bg-white p-10 text-center shadow-lg print:shadow-none">
          <div className="mb-6 flex justify-center"><Logo size={110} /></div>
          <h1 className="text-4xl font-extrabold text-teal" style={{ fontFamily: "'Playfair Display', serif" }}>
            Skip the queue
          </h1>
          <p className="mt-2 text-lg font-semibold text-charcoal/80">
            Order on your phone · pay at the counter · pick up fresh
          </p>

          <div className="my-8 rounded-3xl border-4 border-dashed border-teal/40 bg-cream/60 p-8 print:bg-white">
            <img
              src="/images/order-qr.png"
              alt="Scan to open the Alenna Cafe menu"
              className="mx-auto w-72 max-w-full print:w-[80%]"
            />
            <p className="mt-4 text-2xl font-extrabold tracking-wide text-teal">SCAN TO ORDER</p>
            <p className="mt-1 text-sm text-warm-gray">Point your camera at the code — the menu opens instantly</p>
          </div>

          <div className="grid gap-2 text-sm text-warm-gray">
            <p>📍 9/226 Great South Road, Takanini, Auckland</p>
            <p>🕘 Open daily from 7am · closes 4pm</p>
            <p>☕ Fresh coffee · big breakfasts · homemade sweets</p>
          </div>
          <p className="mt-6 text-xs text-warm-gray/70">Alenna Cafe · Online pickup ordering</p>
        </div>

        <p className="mt-4 text-center text-xs text-warm-gray print:hidden">
          Tip: print A4 or bigger — the QR stays sharp at any size. Works on phones with a normal camera, no app needed.
        </p>
      </div>
    </div>
  );
}
