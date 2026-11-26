"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { ExternalLink } from "lucide-react";

export const PublicFooter: React.FC = () => {
  const pathname = usePathname();

  if (pathname?.startsWith("/horizon")) {
    return null;
  }

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] text-[var(--muted-foreground)] text-sm mt-20">
      <div className="max-w-[1340px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <BrandLogo size="md" />
            <p className="text-xs text-[var(--muted-foreground)] leading-relaxed">
              Connecting hydrological signals, geospatial evidence, and human-governed response intelligence for flood-risk decision support.
            </p>
            <div className="inline-flex items-center px-2.5 py-1 rounded text-[11px] text-[var(--muted-foreground)] border border-[var(--border)] bg-[var(--surface-elevated)]">
              Research Prototype, Academic Evaluation
            </div>
          </div>

          {/* Platform & Documentation */}
          <div>
            <h4 className="font-heading text-xs font-semibold text-[var(--foreground)] mb-3">
              Platform & Documentation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/docs" className="hover:text-[var(--foreground)] transition-colors font-medium text-[var(--foreground)]">
                  Technical Documentation (84 Docs)
                </Link>
              </li>
              <li>
                <Link href="/docs?doc=09-backend-and-api--api-reference" className="hover:text-[var(--foreground)] transition-colors">
                  REST API Reference
                </Link>
              </li>
              <li>
                <Link href="/platform" className="hover:text-[var(--foreground)] transition-colors">
                  Platform Architecture
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-[var(--foreground)] transition-colors">
                  Capabilities & Workflow
                </Link>
              </li>
              <li>
                <Link href="/methodology" className="hover:text-[var(--foreground)] transition-colors">
                  Hydrological Methodology
                </Link>
              </li>
              <li>
                <Link href="/study-area" className="hover:text-[var(--foreground)] transition-colors">
                  Ganga / Patna Study Area
                </Link>
              </li>
              <li>
                <Link href="/demo-lab" className="hover:text-[var(--foreground)] transition-colors">
                  Simulation Lab
                </Link>
              </li>
            </ul>
          </div>

          {/* Research */}
          <div>
            <h4 className="font-heading text-xs font-semibold text-[var(--foreground)] mb-3">
              Scientific Research
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/research" className="hover:text-[var(--foreground)] transition-colors">
                  Validation & NSE Metrics
                </Link>
              </li>
              <li>
                <Link href="/alerts-safety" className="hover:text-[var(--foreground)] transition-colors">
                  CAP v1.2 Alerts & Safety
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-[var(--foreground)] transition-colors">
                  About the Project
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-[var(--foreground)] transition-colors">
                  Research Collaboration
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/shouri123/SURAKSHA-Website"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
                >
                  GitHub Repository <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            </ul>
          </div>

          {/* Application Workspaces */}
          <div>
            <h4 className="font-heading text-xs font-semibold text-[var(--foreground)] mb-3">
              Application Workspaces
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/admin" className="hover:text-[var(--foreground)] transition-colors">
                  Operations Command Centre
                </Link>
              </li>
              <li>
                <Link href="/citizen" className="hover:text-[var(--foreground)] transition-colors">
                  Citizen Flood-Safety Portal
                </Link>
              </li>
              <li>
                <Link href="/auth/login" className="hover:text-[var(--foreground)] transition-colors">
                  Operator & Citizen Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="mt-12 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--subtle-foreground)] gap-4">
          <span>© 2026 SURAKSHA, Scientific Flood-Intelligence and Disaster-Response Research Prototype.</span>
          <span className="text-center sm:text-right text-[11px] text-[var(--subtle-foreground)]">
            Not an official government warning authority.
          </span>
        </div>
      </div>
    </footer>
  );
};
