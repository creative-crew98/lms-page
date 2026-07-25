"use client";

import {
  Check,
  X,
  ArrowUpRight,
  Table2,
  CreditCard,
  MessageCircle,
  Video,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import Eyebrow from "./Eyebrow";
import { beforeAfter } from "@/data/content";
import { useFormModal } from "./FormModalContext";

// Maps each row (by index) to an icon representing its theme.
// Adjust these to match what your actual beforeAfter rows are about —
// this assumes the same 5 themes used in TheProblem.tsx (tracking,
// payments, reminders, videos, reports). Add/remove entries if your
// array has a different length.
const rowIcons: LucideIcon[] = [
  Table2,
  CreditCard,
  MessageCircle,
  Video,
  BarChart3,
];

export default function BeforeAfter() {
  const { open } = useFormModal();

  return (
    <section className="bg-cream py-10 md:py-32 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl mx-auto text-center"
        >
          <Eyebrow>Before vs After</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl text-ink text-balance">
            See the Difference
          </h2>
          <p className="mt-6 text-ink/55 leading-relaxed">
            Same business. Same students. A completely different way of
            running it.
          </p>
        </motion.div>

        {/* two cards with a "VERSUS" medallion overlapping the seam */}
        <div className="mt-16 md:mt-20">
          <div className="flex flex-col md:grid md:grid-cols-[1fr_0px_1fr] md:gap-x-12">
            {/* BEFORE card */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl overflow-hidden bg-white border border-ink/[0.06] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] md:col-start-1"
            >
              <div className="bg-gradient-to-r from-red-500 to-orange-400 py-5 text-center">
                <span className="font-display text-sm md:text-base tracking-wide text-white uppercase">
                  Before (Manual Work)
                </span>
              </div>
              <div>
                {beforeAfter.map((row, i) => {
                  const RowIcon = rowIcons[i % rowIcons.length];
                  return (
                    <motion.div
                      key={row.before}
                      initial={{ opacity: 0, x: -16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.15 + i * 0.08,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`flex items-center gap-4 px-6 py-5 ${i !== beforeAfter.length - 1
                        ? "border-b border-ink/[0.06]"
                        : ""
                        }`}
                    >
                      <span className="shrink-0 h-9 w-9 rounded-xl bg-red-50 border border-red-200 text-red-500 flex items-center justify-center">
                        <RowIcon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      {/* BEFORE card row text */}
                      <span className="flex-1 text-sm md:text-base text-black leading-snug">
                        {row.before}
                      </span>
                      <span className="shrink-0 h-7 w-7 rounded-full bg-red-50 border border-red-200 text-red-500 flex items-center justify-center">
                        <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* mobile: VS divider, sits below the Before card in normal flow */}
            <div className="md:hidden flex items-center justify-center py-6">
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.8 }}
                transition={{
                  duration: 0.5,
                  delay: 0.2,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="h-12 w-12 rounded-full bg-cream border-4 border-white shadow-[0_8px_20px_-6px_rgba(0,0,0,0.2)] flex items-center justify-center font-display text-xs tracking-wide text-ink/60 uppercase"
              >
                vs
              </motion.span>
            </div>

            {/* AFTER card */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl overflow-hidden bg-white border border-ink/[0.06] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] md:col-start-3"
            >
              <div className="bg-gradient-to-r from-[#3FA98A] to-[#63D9AE] py-5 text-center">
                <span className="font-display text-sm md:text-base tracking-wide text-white uppercase">
                  After (Automated LMS)
                </span>
              </div>
              <div>
                {beforeAfter.map((row, i) => {
                  const RowIcon = rowIcons[i % rowIcons.length];
                  return (
                    <motion.div
                      key={row.after}
                      initial={{ opacity: 0, x: 16 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.25 + i * 0.08,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`flex items-center gap-4 px-6 py-5 ${i !== beforeAfter.length - 1
                        ? "border-b border-ink/[0.06]"
                        : ""
                        }`}
                    >
                      <span className="shrink-0 h-9 w-9 rounded-xl bg-[#3FA98A]/10 border border-[#3FA98A]/30 text-[#2E8A6E] flex items-center justify-center">
                        <RowIcon className="h-4 w-4" strokeWidth={1.8} />
                      </span>
                      {/* AFTER card row text */}
                      <span className="flex-1 text-sm md:text-base text-black font-medium leading-snug">
                        {row.after}
                      </span>
                      <span className="shrink-0 h-7 w-7 rounded-full bg-[#3FA98A]/10 border border-[#3FA98A]/30 text-[#2E8A6E] flex items-center justify-center">
                        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* seam column (desktop only) */}
            <div className="hidden md:block md:col-start-2 relative">
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.6 }}
                transition={{
                  duration: 0.6,
                  delay: 0.3,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              >

              </motion.div>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 flex justify-center"
        >
          <button
            onClick={open}
            className="group relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 sm:px-10 sm:py-5 text-sm sm:text-base font-semibold text-[#F1E9FA] bg-gradient-to-r from-[#5D2E8C] to-[#7B4DB5] shadow-[0_10px_40px_rgba(93,46,140,0.55)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_14px_50px_rgba(93,46,140,0.7)] active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89ADC] focus-visible:ring-offset-2 focus-visible:ring-offset-[#1E1C2F]"
          >
            <span
              className="absolute inset-0 rounded-full pointer-events-none cta-pulse"
              style={{ backgroundColor: "#7B4DB5" }}
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
        </motion.div>
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