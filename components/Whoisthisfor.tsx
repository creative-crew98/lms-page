"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowUpRight } from "lucide-react";
import Eyebrow from "./Eyebrow";
import { audience } from "@/data/content";
import { useFormModal } from "./FormModalContext";

/* ------------------------------ scroll reveal ----------------------------- */
/**
 * Fades + lifts an element into place the first time it enters the viewport.
 * Fires once, respects prefers-reduced-motion, supports a stagger delay.
 */
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

export default function WhoIsThisFor() {
  const { open } = useFormModal();
  return (
    <section className="relative bg-cream py-10 md:py-32 overflow-hidden">
      {/* ambient background accents — quiet, not decorative for its own sake */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl opacity-40"
        style={{
          background:
            "radial-gradient(circle, rgba(184,154,220,0.35) 0%, rgba(184,154,220,0) 70%)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full blur-3xl opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(214,193,232,0.4) 0%, rgba(214,193,232,0) 70%)",
        }}
      />

      <div className="relative max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <Eyebrow>Who is this for?</Eyebrow>
            <h2 className="font-display text-3xl md:text-5xl text-ink text-balance">
              Perfect For
            </h2>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-5">
          {audience.map(({ icon: Icon, title }, i) => {
            const isLast = i === audience.length - 1;
            return (
              <Reveal
                key={title}
                delay={i * 100}
                className={isLast ? "col-span-2 lg:col-span-4" : ""}
              >
                <div
                  className={`group h-full rounded-2xl border transition-all duration-300 ${isLast
                    ? "bg-gradient-to-r from-plum/[0.06] to-violet/[0.06] border-plum/15 hover:border-plum/30 hover:shadow-[0_16px_40px_-18px_rgba(120,70,160,0.25)] p-8 md:p-10 flex flex-col sm:flex-row items-center justify-center gap-5 text-center sm:text-left"
                    : "bg-white border-ink/[0.06] hover:border-plum/30 hover:-translate-y-1 hover:shadow-[0_16px_36px_-16px_rgba(0,0,0,0.14)] p-7 flex flex-col items-start gap-4"
                    }`}
                >
                  <div
                    className={`rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-[0_6px_16px_-6px_rgba(120,70,160,0.45)] ${isLast ? "h-16 w-16" : "h-11 w-11"
                      }`}
                    style={{
                      background:
                        "radial-gradient(circle at 35% 30%, #D6C1E8 0%, #B89ADC 70%)",
                    }}
                  >
                    <Icon
                      className={isLast ? "h-7 w-7 text-white" : "h-5 w-5 text-white"}
                      strokeWidth={1.8}
                    />
                  </div>
                  <h3
                    className={
                      isLast
                        ? "font-display text-xl md:text-2xl text-ink text-balance"
                        : "font-display text-base md:text-lg text-ink text-balance"
                    }
                  >
                    {title}
                  </h3>
                </div>
              </Reveal>
            );
          })}
        </div>


        {/* CTA button */}
        <Reveal delay={audience.length * 100 + 150} className="mt-10 flex justify-center">
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