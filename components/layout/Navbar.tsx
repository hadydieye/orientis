"use client";

import Link from "next/link";
import { useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassInput } from "@/components/ui/GlassInput";

// "Établissements" et "Explorer" menaient au même endroit : le doublon est
// retiré plutôt que dupliqué sous deux noms.
const links = [
  { label: "Établissements", href: "/explorer" },
  { label: "Formations", href: "/formations" },
  { label: "Orientation", href: "/orientation" },
  { label: "À propos", href: "/a-propos" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-3 top-3 z-50 sm:inset-x-6 sm:top-4 md:inset-x-10">
      <div className="mx-auto flex max-w-6xl items-center gap-4 rounded-pill border border-glass-border bg-[rgba(7,11,20,0.65)] px-4 py-2.5 backdrop-blur-[20px] sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          <span className="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
            Orientis
          </span>
        </Link>

        <nav className="ml-2 hidden flex-1 items-center gap-6 md:flex">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm text-muted transition-colors duration-150 ease-out hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden w-56 lg:block">
          <GlassInput type="search" placeholder="Rechercher..." />
        </div>

        <Link href="/orientation" className="hidden shrink-0 sm:inline-flex">
          <GlassButton variant="primary">Trouver ma voie</GlassButton>
        </Link>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-glass-border text-foreground transition-colors duration-150 ease-out md:hidden"
        >
          <span className="sr-only">Menu</span>
          {open ? "✕" : "☰"}
        </button>
      </div>

      {open && (
        <nav className="animate-fade-in-up mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-card border border-glass-border bg-[rgba(7,11,20,0.85)] p-4 backdrop-blur-[20px] md:hidden">
          {links.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-button px-3 py-2 text-sm text-muted transition-colors duration-150 ease-out hover:bg-glass-2 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-3">
            <GlassInput type="search" placeholder="Rechercher..." />
            <Link href="/orientation" onClick={() => setOpen(false)}>
              <GlassButton variant="primary" className="w-full">
                Trouver ma voie
              </GlassButton>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
