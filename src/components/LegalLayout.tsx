import type { ReactNode } from "react";
import Logo from "@/components/Logo";

export default function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-teal-deep text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
          <a href="/" className="flex items-center gap-3">
            <Logo size={48} />
            <span className="font-bold">Alenna Cafe</span>
          </a>
          <a href="/" className="text-sm text-brand">Back to site</a>
        </div>
      </header>
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="mb-6 text-4xl font-bold text-teal" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h1>
        <div className="space-y-4 text-sm leading-7 text-charcoal/90">{children}</div>
      </article>
    </div>
  );
}
