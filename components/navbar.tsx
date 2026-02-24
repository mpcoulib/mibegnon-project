"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/bourses", label: "Bourses" },
  { href: "/universites", label: "Universités" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--primary)]/20 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <svg
            viewBox="0 0 32 36"
            fill="none"
            className="h-8 w-8 text-[var(--gold)]"
            aria-hidden="true"
          >
            <path
              d="M2 2H30V22Q30 34 16 34Q2 34 2 22Z"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <text
              x="8"
              y="25"
              fontSize="14"
              fontWeight="700"
              fill="currentColor"
              fontFamily="Georgia, serif"
            >
              m
            </text>
          </svg>
          <span className="font-serif text-xl font-bold text-[var(--primary)]">
            mibegnon
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[var(--primary)] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Button asChild size="sm">
            <Link href="/connexion">Se connecter</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-md text-slate-600 hover:text-[var(--primary)] hover:bg-slate-100 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-[var(--primary)]/20 bg-white px-4 pb-4">
          <nav className="flex flex-col gap-1 pt-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[var(--primary)] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 pt-3 border-t border-slate-100">
            <Button asChild size="sm" className="w-full">
              <Link href="/connexion" onClick={() => setIsOpen(false)}>
                Se connecter
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
