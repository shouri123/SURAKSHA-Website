"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Menu, X, ChevronDown, ArrowRight, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/supabase/auth-context";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export const PublicNavbar: React.FC = () => {
  const pathname = usePathname();
  const { user, profile, role, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [platformDropdownOpen, setPlatformDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const platformMenuRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const isHome = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!platformDropdownOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!platformMenuRef.current?.contains(event.target as Node)) {
        setPlatformDropdownOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPlatformDropdownOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [platformDropdownOpen]);

  if (
    pathname?.startsWith("/horizon") ||
    pathname?.startsWith("/admin") ||
    pathname?.startsWith("/citizen")
  ) {
    return null;
  }

  const links = [
    { href: "/platform", label: "Platform", hasDropdown: true },
    { href: "/research", label: "Research" },
    { href: "/docs", label: "Documentation" },
    { href: "/about", label: "About" },
  ];

  const portalHref =
    role === "admin" || role === "hydrologist" || role === "operator" ? "/admin" : "/citizen";
  const portalLabel =
    !profile
      ? "Profile unavailable"
      : role === "admin" || role === "hydrologist" || role === "operator"
      ? "Operations Command"
      : "Citizen Portal";

  const headerClass = isHome
    ? scrolled
      ? "fixed top-0 inset-x-0 z-50 bg-[var(--surface-glass)] backdrop-blur-md transition-all duration-300 border-b border-[var(--border)]"
      : "fixed top-0 inset-x-0 z-50 bg-transparent border-none transition-all duration-300"
    : "sticky top-0 z-50 w-full border-b border-[var(--border)] bg-[var(--surface-glass)] backdrop-blur-md transition-colors";

  return (
    <motion.header
      className={headerClass}
      data-home-hero={isHome && !scrolled ? "true" : undefined}
      initial={false}
      transition={{ duration: prefersReducedMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="w-full px-6 sm:px-10 lg:px-14 h-16 sm:h-20 flex items-center justify-between gap-6">
        <BrandLogo className="brand-logo" />

        {/* Desktop Navigation Links */}
        <nav
          className="hidden md:flex items-center gap-1.5 p-1 rounded-full nav-glass-dock"
          aria-label="Main Navigation"
        >
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.hasDropdown &&
                (pathname.startsWith("/platform") ||
                  pathname.startsWith("/study-area") ||
                  pathname.startsWith("/demo-lab")));

            if (link.hasDropdown) {
              return (
                <div key={link.href} className="relative" ref={platformMenuRef}>
                  <button
                    type="button"
                    onClick={() => setPlatformDropdownOpen(!platformDropdownOpen)}
                    aria-expanded={platformDropdownOpen}
                    aria-haspopup="menu"
                    onKeyDown={(event) => {
                      if (event.key === "Escape") setPlatformDropdownOpen(false);
                    }}
                    className={`nav-glass-pill text-xs font-semibold cursor-pointer ${
                      isActive ? "active text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    <span>{link.label}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        platformDropdownOpen ? "rotate-180 text-[var(--brand)]" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {platformDropdownOpen && (
                      <motion.div
                        role="menu"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                        className="absolute top-full left-0 mt-2.5 w-80 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] p-1.5 shadow-[var(--shadow-overlay)] z-50"
                      >
                        <Link
                          href="/platform"
                          role="menuitem"
                          onClick={() => setPlatformDropdownOpen(false)}
                          className="block p-2.5 rounded-lg hover:bg-[var(--surface-raised)] transition-colors text-xs group"
                        >
                          <span className="font-semibold text-[var(--foreground)] block group-hover:text-[var(--brand)] transition-colors">
                            Platform Overview
                          </span>
                          <span className="text-[11px] text-[var(--muted-foreground)]">
                            3D Basin simulation and reach models
                          </span>
                        </Link>

                        <Link
                          href="/study-area"
                          role="menuitem"
                          onClick={() => setPlatformDropdownOpen(false)}
                          className="block p-2.5 rounded-lg hover:bg-[var(--surface-raised)] transition-colors text-xs group"
                        >
                          <span className="font-semibold text-[var(--foreground)] block group-hover:text-[var(--brand)] transition-colors">
                            Catchment Study Area
                          </span>
                          <span className="text-[11px] text-[var(--muted-foreground)]">
                            Middle Ganga reach stations and gauges
                          </span>
                        </Link>

                        <Link
                          href="/demo-lab"
                          role="menuitem"
                          onClick={() => setPlatformDropdownOpen(false)}
                          className="block p-2.5 rounded-lg hover:bg-[var(--surface-raised)] transition-colors text-xs group"
                        >
                          <span className="font-semibold text-[var(--foreground)] block group-hover:text-[var(--brand)] transition-colors">
                            Simulation Lab
                          </span>
                          <span className="text-[11px] text-[var(--muted-foreground)]">
                            Interactive test scenarios and response checks
                          </span>
                        </Link>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-glass-pill text-xs font-semibold ${
                  isActive ? "active text-[var(--foreground)]" : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                }`}
              >
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Controls - Auth State Aware */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-3">
              {profile ? (
                <Link
                  href={portalHref}
                  className="btn-glass-primary px-4 py-2 text-xs font-semibold group whitespace-nowrap"
                >
                  <span>{portalLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <span role="status" className="px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                  Workspace unavailable
                </span>
              )}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface-elevated)] hover:border-[var(--border-hover)] text-xs text-[var(--foreground)] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span className="w-6 h-6 rounded-full bg-[var(--brand)] text-[var(--primary-foreground)] font-bold text-[10px] grid place-items-center">
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : "U"}
                  </span>
                  <span className="max-w-[100px] truncate text-xs font-medium">
                    {profile?.full_name?.split(" ")[0] || "Account"}
                  </span>
                  <ChevronDown className="w-3 h-3 text-[var(--muted-foreground)]" />
                </button>

                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: prefersReducedMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--surface-elevated)] border border-[var(--border)] p-1.5 shadow-[var(--shadow-overlay)] z-50"
                    >
                      <div className="px-3 py-2 border-b border-[var(--border)] mb-1">
                        <div className="text-xs font-semibold text-[var(--foreground)] truncate">
                          {profile?.full_name || user.email}
                        </div>
                        <div className="text-[11px] text-[var(--muted-foreground)] mt-0.5">
                          ROLE: {profile?.role || "Unavailable"}
                        </div>
                      </div>
                      {profile ? (
                        <Link
                          href={portalHref}
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
                        >
                          <User className="w-3.5 h-3.5" />
                          <span>Open Workspace</span>
                        </Link>
                      ) : (
                        <p className="px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                          Account role could not be verified. Contact an administrator or sign out.
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setUserDropdownOpen(false);
                          signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="btn-glass-primary px-5 py-2 text-xs font-semibold group whitespace-nowrap inline-flex items-center gap-1.5 shrink-0"
            >
              <span className="whitespace-nowrap">Sign In</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 shrink-0" />
            </Link>
          )}
        </div>

        {/* Mobile Menu Trigger */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            profile ? (
              <Link href={portalHref} className="btn-glass-primary px-3.5 py-1.5 text-xs font-medium">
                Workspace
              </Link>
            ) : (
              <span role="status" className="px-2 text-[10px] text-amber-700 dark:text-amber-300">
                Profile unavailable
              </span>
            )
          ) : (
            <Link href="/auth/login" className="btn-glass-primary px-3.5 py-1.5 text-xs">
              Sign In
            </Link>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--foreground)] hover:bg-[var(--surface-raised)] transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-navigation"
            initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden border-b border-[var(--border)] bg-[var(--surface)] px-6 pt-3 pb-6 space-y-3"
          >
            <div className="flex flex-col space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-md text-xs font-medium ${
                    pathname === link.href
                      ? "bg-[var(--brand-soft)] text-[var(--brand)] font-semibold border border-[var(--brand-border)]"
                      : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/demo-lab"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2 rounded-md text-xs font-medium ${
                  pathname === "/demo-lab"
                    ? "bg-[var(--brand-soft)] text-[var(--brand)] font-semibold border border-[var(--brand-border)]"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface-elevated)]"
                }`}
              >
                Simulation Lab
              </Link>
            </div>

            <div className="pt-4 border-t border-[var(--border)] flex flex-col gap-2">
              {user ? (
                <>
                  <div className="px-3 py-2 rounded-md bg-[var(--surface-elevated)] border border-[var(--border)]">
                    <div className="text-xs font-semibold text-[var(--foreground)]">
                      {profile?.full_name || user.email}
                    </div>
                    <div className="text-[11px] text-[var(--muted-foreground)]">
                      Role: {profile?.role || "Unavailable"}
                    </div>
                  </div>
                  {profile ? (
                    <Link href={portalHref} onClick={() => setMobileMenuOpen(false)}>
                      <Button className="w-full text-xs justify-center font-semibold">
                        {portalLabel} →
                      </Button>
                    </Link>
                  ) : (
                    <p role="status" className="px-3 py-2 text-xs leading-relaxed text-amber-700 dark:text-amber-300">
                      Account role could not be verified. Contact an administrator or sign out.
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full py-2 text-xs text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 rounded-md border border-rose-500/20 bg-rose-500/10 text-center cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/citizen" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full text-xs justify-center">
                      Citizen Portal
                    </Button>
                  </Link>
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full text-xs justify-center">
                      Operations Command Centre
                    </Button>
                  </Link>
                  <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full text-xs justify-center font-semibold">
                      Sign In →
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
