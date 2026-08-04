"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { useFormModal } from "./FormModalContext";

const features = [
  "Students",
  "Fees",
  "Courses",
  "Attendance",
  "Notifications",
  "Reports",
];

/* ------------------------------ scroll reveal ----------------------------- */
function useReveal<T extends HTMLElement>(delay = 0) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => setVisible(true), delay);
          observer.unobserve(node);
          return () => clearTimeout(timer);
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -60px 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  return { ref, visible };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, visible } = useReveal<HTMLDivElement>(delay);
  return (
    <div
      ref={ref}
      className={[
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/* ------------------------------- component ------------------------------- */

export default function FinalCta() {
  const { open } = useFormModal();
  return (
    <section
      id="consultation"
      className="relative overflow-hidden bg-ink-glow py-28 md:py-36"
    >
      <div className="absolute inset-0 bg-violet-glow pointer-events-none" />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <Reveal>
          <h2 className="font-display text-3xl md:text-5xl text-cream text-balance">
            Ready to Automate Your Coaching Business?
          </h2>
        </Reveal>

        <Reveal delay={100}>
          <p className="mt-6 text-mist/60 max-w-xl mx-auto leading-relaxed">
            Stop wasting hours on spreadsheets, reminders, and payment
            follow-ups. Get your own branded LMS software that automatically
            manages:
          </p>
        </Reveal>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {features.map((feature, i) => (
            <Reveal key={feature} delay={180 + i * 80}>
              <span className="inline-flex items-center gap-2 rounded-full border border-mist/20 bg-white/[0.04] px-4 py-2 text-sm text-cream/85">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet/30 shrink-0">
                  <Check className="h-2.5 w-2.5 text-cream" strokeWidth={3} />
                </span>
                {feature}
              </span>
            </Reveal>
          ))}
        </div>

        <Reveal delay={180 + features.length * 80}>
          <p className="mt-6 font-display text-lg md:text-xl text-cream">
            All from one dashboard.
          </p>
        </Reveal>

        <Reveal
          delay={280 + features.length * 80}
          className="mt-10 flex justify-center"
        >
          <button
            onClick={open}
            className="group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 sm:px-10 sm:py-5 text-sm sm:text-base font-semibold text-[#3A2E00] bg-gradient-to-r from-[#F5C518] to-[#FFDB4D] shadow-[0_10px_40px_rgba(245,197,24,0.55)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_50px_rgba(245,197,24,0.7)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFE985] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1C2F]"
          >
            <span
              className="absolute inset-0 rounded-full pointer-events-none cta-pulse"
              style={{ backgroundColor: "#FFDB4D" }}
              aria-hidden="true"
            />

            {/* Shine sweep */}
            <span
              className="absolute inset-0 rounded-full pointer-events-none overflow-hidden"
              aria-hidden="true"
            >
              <span className="shine-sweep absolute top-0 left-0 h-full w-1/3 -skew-x-12" />
            </span>

            <span
              className="relative font-bold text-lg text-glow"
            >
              Book Your Free Demo
            </span>
            {/* <ArrowUpRight className="relative h-6 w-6 sm:h-5 sm:w-5 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /> */}
          </button>
        </Reveal>

        <Reveal delay={360 + features.length * 80}>
          <p className="mt-10 font-mono text-xs tracking-widest uppercase text-lilac/50">
            Strategy · Design · Development · Deployment · Support
          </p>
        </Reveal>
      </div>

      <style jsx>{`
        @keyframes ctaPulse {
          0% {
            opacity: 0.35;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(1.25);
          }
        }
        .cta-pulse {
          animation: ctaPulse 2s ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .cta-pulse {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}