"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { Search, ShoppingCart, User as UserIcon, Menu, X, LayoutGrid, LogIn, Heart } from "lucide-react";
import Logo from "./Logo";
import { useSite } from "@/context/SiteContext";

export default function Header() {
  const { isAuthenticated, user } = useAuth();
  const { categories, navLinks } = useSite();
  const [menuOpen, setMenuOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { count, openDrawer } = useCart();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setMenuOpen(false);
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      {/* Main row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 lg:h-[72px] flex items-center gap-3 lg:gap-6">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
          className="lg:hidden p-2 -ml-2 rounded-lg text-navy-700 hover:bg-slate-100 cursor-pointer"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <Logo />

        {/* Search */}
        <form
          role="search"
          onSubmit={submitSearch}
          className="hidden md:flex flex-1 max-w-2xl mx-auto items-center rounded-full border-2 border-brand-500/70 focus-within:border-brand-600 focus-within:ring-4 focus-within:ring-brand-500/15 bg-white overflow-hidden transition-all"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vitamins, skin care, baby, grocery…"
            aria-label="Search products"
            className="flex-1 px-5 py-2.5 text-sm outline-none bg-transparent placeholder:text-slate-400"
          />
          <button
            type="submit"
            aria-label="Search"
            className="m-1 px-5 py-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span className="hidden xl:inline">Search</span>
          </button>
        </form>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-3">
          <button type="button" aria-label="Wishlist" className="hidden sm:flex p-2.5 rounded-full text-navy-700 hover:bg-brand-50 hover:text-brand-700 transition-colors cursor-pointer">
            <Heart className="w-5 h-5" />
          </button>

          {isAuthenticated ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-sm font-bold hover:bg-brand-100 transition-colors"
            >
              <span className="w-7 h-7 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                {(user?.name?.[0] || "U").toUpperCase()}
              </span>
              <span className="hidden sm:inline">{user?.name?.split(" ")[0] || "Account"}</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold text-navy-700 hover:bg-slate-100 transition-colors">
                <LogIn className="w-4 h-4 text-brand-600" /> Sign In
              </Link>
              <Link href="/register" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white btn-primary-gradient">
                <UserIcon className="w-4 h-4" />
                <span>Register</span>
              </Link>
            </>
          )}

          <button
            type="button"
            aria-label={`Open cart, ${count} items`}
            onClick={openDrawer}
            className="relative p-2.5 rounded-full bg-navy-700 text-white hover:bg-navy-600 transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-sun-400 text-navy-800 text-[11px] font-black flex items-center justify-center">
              {count > 99 ? "99+" : count}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile search */}
      <form onSubmit={submitSearch} role="search" className="md:hidden px-4 pb-3">
        <div className="flex items-center rounded-full border-2 border-brand-500/70 bg-white overflow-hidden">
          <Search className="w-4 h-4 ml-4 text-slate-400" />
          <input type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" aria-label="Search products" className="flex-1 px-3 py-2.5 text-sm outline-none bg-transparent" />
        </div>
      </form>

      {/* Desktop nav strip */}
      <nav className="hidden lg:block border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center gap-1 relative">
          <div className="relative" onMouseEnter={() => setCatOpen(true)} onMouseLeave={() => setCatOpen(false)}>
            <button
              type="button"
              aria-expanded={catOpen}
              onClick={() => setCatOpen((v) => !v)}
              className="flex items-center gap-2 h-11 px-4 bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors cursor-pointer"
            >
              <LayoutGrid className="w-4 h-4" /> Shop By Category
            </button>
            {catOpen && (
              <div className="absolute left-0 top-full w-[560px] bg-white rounded-b-2xl border border-slate-200 shadow-2xl p-3 grid grid-cols-2 gap-1">
                {categories.map((c) => (
                  <Link key={c.slug} href={`/shop?category=${c.slug}`} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-50 transition-colors">
                    <span className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg ${c.tint}`}>{c.emoji}</span>
                    <span className="text-sm font-semibold text-navy-700">{c.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
          {navLinks.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className={`px-4 h-11 flex items-center text-sm font-semibold transition-colors ${
                l.hot ? "text-coral-500 hover:text-rose-600" : "text-navy-700 hover:text-brand-600"
              }`}
            >
              {l.hot && <span className="mr-1.5">🔥</span>}
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[70vh] overflow-y-auto">
          <div className="px-4 py-3 grid grid-cols-2 gap-2">
            {categories.map((c) => (
              <Link key={c.slug} href={`/shop?category=${c.slug}`} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-100 hover:bg-brand-50">
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.tint}`}>{c.emoji}</span>
                <span className="text-xs font-semibold text-navy-700 leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
          <div className="px-4 pb-4 flex flex-col">
            {navLinks.map((l) => (
              <Link key={l.label} href={l.href} onClick={() => setMenuOpen(false)} className="py-2.5 text-sm font-semibold text-navy-700 border-t border-slate-100">
                {l.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <Link href="/login" className="py-2.5 text-sm font-semibold text-brand-700 border-t border-slate-100">
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
