"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Handshake, LayoutDashboard, Rocket, ArrowUpRight } from "lucide-react";
import Eyebrow from "./Eyebrow";
import { useFormModal } from "./FormModalContext";

const steps = [
  {
    n: "01",
    icon: Handshake,
    title: "Book a Demo",
    body: "We understand how you currently manage students, fees, and courses.",
    accent: "#6D4AA8", // violet
  },
  {
    n: "02",
    icon: LayoutDashboard,
    title: "We Build Your LMS",
    body: "Customized with your branding, batches, courses, and payment setup.",
    accent: "#1798A8", // teal
  },
  {
    n: "03",
    icon: Rocket,
    title: "Launch & Automate",
    body: "Invite students and let the system handle the repetitive work.",
    accent: "#C93E7E", // rose
  },
] as const;

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

/* ---------------------------- circle + callout ---------------------------- */

function StepNode({
  step,
  size,
  left,
  top,
  labelTop,
  delay = 0,
}: {
  step: (typeof steps)[number];
  size: number;
  left: string;
  top: string;
  /** true = text box sits above the circle, false = below */
  labelTop: boolean;
  delay?: number;
}) {
  const Icon = step.icon;
  const { ref, visible } = useReveal<HTMLDivElement>(delay);
  return (
    <div
      ref={ref}
      className={[
        "absolute flex flex-col items-center gap-5 transition-opacity duration-700 ease-out motion-reduce:transition-none",
        visible ? "opacity-100" : "opacity-0",
      ].join(" ")}
      style={{
        left,
        top,
        transform: `translate(-50%, calc(-50% + ${visible ? "0px" : "16px"}))`,
        transition: "opacity 0.7s ease-out, transform 0.7s ease-out",
      }}
    >
      {labelTop && <Callout step={step} />}
      <div
        className="rounded-full flex items-center justify-center shrink-0 ring-4 ring-white shadow-[0_14px_30px_-10px_rgba(0,0,0,0.35)]"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 35% 30%, ${step.accent}dd 0%, ${step.accent} 75%)`,
        }}
      >
        <Icon
          className="text-white"
          strokeWidth={1.6}
          style={{ width: size * 0.34, height: size * 0.34 }}
        />
      </div>
      {!labelTop && <Callout step={step} />}
    </div>
  );
}

function Callout({ step }: { step: (typeof steps)[number] }) {
  return (
    <div className="w-60 md:w-64 rounded-xl border border-ink/[0.08] bg-white/90 backdrop-blur-sm px-5 py-4 text-center shadow-[0_10px_26px_-14px_rgba(0,0,0,0.18)]">
      <p
        className="font-mono text-xs tracking-widest"
        style={{ color: step.accent }}
      >
        STEP {step.n}
      </p>
      <h3 className="font-display text-xl md:text-2xl text-ink mt-1.5">
        {step.title}
      </h3>
      <p className="mt-2 text-sm md:text-base text-ink/55 leading-relaxed">
        {step.body}
      </p>
    </div>
  );
}

/* ------------------------------- component ------------------------------- */

export default function HowItWorks() {
  const { open } = useFormModal();
  return (
    <section className="bg-white py-10 md:py-32">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <Reveal>
          <div className="max-w-2xl mx-auto text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-display text-3xl md:text-5xl text-ink text-balance">
              Get Your LMS in 3 Simple Steps
            </h2>
          </div>
        </Reveal>

        {/* ---------- Desktop / tablet: connected-node infographic ---------- */}
        <Reveal delay={150} className="hidden md:block mt-20">
          <div className="relative mx-auto max-w-4xl" style={{ height: 460 }}>
            {/* connector curves, drawn in percentage space to track the node positions */}
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              fill="none"
            >
              <path
                d="M20,34 C20,48 32,54 40,61"
                stroke="#00000018"
                strokeWidth="0.5"
                strokeLinecap="round"
              />
              <path
                d="M80,34 C80,48 68,54 60,61"
                stroke="#00000018"
                strokeWidth="0.5"
                strokeLinecap="round"
              />
              <circle cx="20" cy="34" r="0.9" fill={steps[0].accent} />
              <circle cx="30" cy="50" r="0.9" fill={steps[0].accent} />
              <circle cx="80" cy="34" r="0.9" fill={steps[2].accent} />
              <circle cx="70" cy="50" r="0.9" fill={steps[2].accent} />
            </svg>

            <StepNode step={steps[0]} size={120} left="20%" top="22%" labelTop={false} delay={0} />
            <StepNode step={steps[1]} size={140} left="50%" top="66%" labelTop={true} delay={150} />
            <StepNode step={steps[2]} size={120} left="80%" top="22%" labelTop={false} delay={300} />
          </div>
        </Reveal>

        {/* ---------------- Mobile: simple stacked fallback ---------------- */}
        <div className="mt-14 grid gap-6 md:hidden">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <Reveal key={step.n} delay={i * 130}>
                <div className="rounded-2xl border border-ink/[0.06] bg-white p-6 flex items-start gap-4 shadow-[0_10px_26px_-16px_rgba(0,0,0,0.15)]">
                  <div
                    className="h-12 w-12 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: `radial-gradient(circle at 35% 30%, ${step.accent}dd 0%, ${step.accent} 75%)`,
                    }}
                  >
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p
                      className="font-mono text-xs tracking-widest"
                      style={{ color: step.accent }}
                    >
                      STEP {step.n}
                    </p>
                    <h3 className="font-display text-xl text-ink mt-1.5">
                      {step.title}
                    </h3>
                    <p className="mt-2 text-base text-ink/55 leading-relaxed">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>


        {/* CTA button */}
        <Reveal delay={steps.length * 130 + 300} className="mt-8 flex justify-center">
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