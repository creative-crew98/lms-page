"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  UserPlus,
  Settings,
  LayoutDashboard,
  Video,
  CreditCard,
  BarChart3,
  Bell,
  CheckCircle2,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import Eyebrow from "./Eyebrow";
import { pipeline } from "@/data/content";
import { motion, useInView } from "framer-motion";
import { useFormModal } from "./FormModalContext";

const COLS = 3;
const BULGE = 170; // outward push at row turns — must clear the widest
// rightmost-column text (see maxWidthRight below)
const CORNER_RADIUS = 52;
const MOBILE_ZIGZAG = 170; // how far the mobile connector bows left/right
// between two vertically-stacked icons
const MOBILE_CORNER_RADIUS = 16; // tighter than desktop's CORNER_RADIUS so
// the zigzag reads as sharp jogs, not a
// smooth wave

const DEFAULT_ICONS: LucideIcon[] = [
  UserPlus,
  Settings,
  LayoutDashboard,
  Video,
  CreditCard,
  BarChart3,
  Bell,
  CheckCircle2,
];

type Point = { x: number; y: number };
type PipelineItem = { title: string; body: string; icon?: LucideIcon };

function chunk<T>(arr: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < arr.length; i += size) rows.push(arr.slice(i, i + size));
  return rows;
}

function withBulges(points: Point[], rows: unknown[][], bulge: number): Point[] {
  const result: Point[] = [];
  let idx = 0;
  rows.forEach((row, rowIdx) => {
    for (let c = 0; c < row.length; c++) {
      result.push(points[idx]);
      idx++;
    }
    const isLastRow = rowIdx === rows.length - 1;
    if (!isLastRow) {
      // Rows are right-aligned (via startCol = COLS - row.length), so a
      // full row and the row after it — even a shorter trailing row —
      // always share the same edge x at the turn. That means every turn,
      // including into a partial last row, can use the same bulge
      // treatment for a consistent rounded-curve look.
      const lastPoint = points[idx - 1];
      const nextPoint = points[idx];
      const dir = rowIdx % 2 === 0 ? 1 : -1;
      result.push({ x: lastPoint.x + dir * bulge, y: lastPoint.y });
      result.push({
        x: (nextPoint?.x ?? lastPoint.x) + dir * bulge,
        y: nextPoint?.y ?? lastPoint.y,
      });
    }
  });
  return result;
}

// Same list of points (all sharing one x, stacked by y — the mobile
// icon column), but between every pair inserts a "drop → jog sideways →
// drop → jog back" set of waypoints, alternating left/right each time.
// Combined with roundedPath's corner rounding this reads as a boxy
// zigzag (straight vertical drops, sharp sideways jogs) rather than one
// smooth continuous wave, while still passing exactly through every
// icon's center.
function withZigzag(points: Point[], amplitude: number): Point[] {
  const result: Point[] = [];
  points.forEach((point, idx) => {
    result.push(point);
    const next = points[idx + 1];
    if (next) {
      const dir = idx % 2 === 0 ? 1 : -1;
      const y1 = point.y + (next.y - point.y) * 0.20;
      const y2 = point.y + (next.y - point.y) * 0.80;
      result.push({ x: point.x, y: y1 });
      result.push({ x: point.x + dir * amplitude, y: y1 });
      result.push({ x: point.x + dir * amplitude, y: y2 });
      result.push({ x: point.x, y: y2 });
    }
  });
  return result;
}

function roundedPath(points: Point[], radius = CORNER_RADIUS) {
  if (points.length < 2) return "";
  const d: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const v1 = { x: curr.x - prev.x, y: curr.y - prev.y };
    const v2 = { x: next.x - curr.x, y: next.y - curr.y };
    const len1 = Math.hypot(v1.x, v1.y) || 1;
    const len2 = Math.hypot(v2.x, v2.y) || 1;
    const r = Math.min(radius, len1 / 2, len2 / 2);

    const p1 = { x: curr.x - (v1.x / len1) * r, y: curr.y - (v1.y / len1) * r };
    const p2 = { x: curr.x + (v2.x / len2) * r, y: curr.y + (v2.y / len2) * r };

    d.push(`L ${p1.x} ${p1.y}`, `Q ${curr.x} ${curr.y} ${p2.x} ${p2.y}`);
  }

  const last = points[points.length - 1];
  d.push(`L ${last.x} ${last.y}`);
  return d.join(" ");
}

export default function EcosystemPipeline() {
  const { open } = useFormModal();
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [pathD, setPathD] = useState("");
  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  const mobileContainerRef = useRef<HTMLDivElement>(null);
  const mobileNodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [mobilePathD, setMobilePathD] = useState("");
  const [mobileSvgSize, setMobileSvgSize] = useState({ width: 0, height: 0 });

  const rows = chunk(pipeline as PipelineItem[], COLS);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const points: Point[] = nodeRefs.current
        .filter((el): el is HTMLDivElement => !!el)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            x: r.left - containerRect.left + r.width / 2,
            y: r.top - containerRect.top + r.height / 2,
          };
        });
      if (points.length > 1) {
        setPathD(roundedPath(withBulges(points, rows, BULGE)));
      }
      setSvgSize({ width: containerRect.width, height: containerRect.height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    const container = mobileContainerRef.current;
    if (!container) return;

    const measure = () => {
      const containerRect = container.getBoundingClientRect();
      const points: Point[] = mobileNodeRefs.current
        .filter((el): el is HTMLDivElement => !!el)
        .map((el) => {
          const r = el.getBoundingClientRect();
          return {
            x: r.left - containerRect.left + r.width / 2,
            y: r.top - containerRect.top + r.height / 2,
          };
        });
      if (points.length > 1) {
        setMobilePathD(
          roundedPath(withZigzag(points, MOBILE_ZIGZAG), MOBILE_CORNER_RADIUS)
        );
      }
      setMobileSvgSize({ width: containerRect.width, height: containerRect.height });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section id="ecosystem" className="bg-ink py-24 md:py-32">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="max-w-2xl mx-auto text-center">
          <Eyebrow dark>One powerful platform</Eyebrow>
          <h2 className="font-display text-3xl md:text-5xl text-cream text-balance">
            One Platform That Runs Your Coaching Automatically
          </h2>
          <p className="mt-6 text-mist/60 leading-relaxed">
            Imagine if every student got instant access, automatic reminders, and
            a personal dashboard — while you got real-time reports, records, and
            zero WhatsApp chaos.
          </p>
        </div>

        {/* desktop: serpentine roadmap */}
        <div ref={containerRef} className="hidden md:block relative mt-24 mb-6 ms-20">
          <svg
            className="absolute inset-0 pointer-events-none overflow-visible"
            width={svgSize.width}
            height={svgSize.height}
          >
            <defs>
              <linearGradient
                id="pipelineGradient"
                x1="0"
                y1="0"
                x2={svgSize.width}
                y2={svgSize.height}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#7B4DB5" />
                <stop offset="55%" stopColor="#5D2E8C" />
                <stop offset="100%" stopColor="#3FA98A" />
              </linearGradient>
            </defs>

            {pathD && (
              <>
                <path
                  d={pathD}
                  fill="none"
                  stroke="url(#pipelineGradient)"
                  strokeWidth={26}
                  strokeLinecap="round"
                  opacity={0.15}
                  style={{ filter: "blur(10px)", marginTop: "20px", marginLeft: "100px" }}
                />
                <motion.path
                  d={pathD}
                  fill="none"
                  stroke="url(#pipelineGradient)"
                  strokeWidth={12}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                />
                <path
                  d={pathD}
                  fill="none"
                  stroke="#F1E9FA"
                  strokeOpacity={0.5}
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="2 24"
                  className="pipeline-flow"
                />
              </>
            )}
          </svg>


          <div className="flex flex-col gap-4">
            {rows.map((row, rowIndex) => {
              const isReversed = rowIndex % 2 === 1;
              const flatIndex = rowIndex * COLS;
              // A short trailing row (e.g. a lone final item) should sit
              // under whichever column the row above ends on — here that's
              // always the rightmost column, since rows render in normal
              // reading order and the connector simply drops from the last
              // node of the row above. Right-aligning it (instead of true
              // centering) makes that drop a straight vertical line instead
              // of a diagonal, since the node's x now matches exactly.
              const startCol = COLS - row.length;
              // Explicit reversal instead of CSS `direction: rtl` — guaranteed
              // to actually flip visual order, which is what the bulge math
              // (and therefore the "no overlap" guarantee) depends on.
              const renderedRow = isReversed ? [...row].reverse() : row;

              return (
                <div key={rowIndex} className="grid grid-cols-3 gap-3">
                  {renderedRow.map((step, physicalCol) => {
                    const originalCol = isReversed
                      ? row.length - 1 - physicalCol
                      : physicalCol;
                    const i = flatIndex + originalCol;
                    const Icon = step.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length];

                    // Only the rightmost physical column is ever the side a
                    // bulge travels toward (see explanation above the
                    // component) — cap its text width so it can never reach
                    // into the bulge's path, regardless of copy length.
                    // Uses the actual grid column (startCol + physicalCol),
                    // not just physicalCol, so this still holds for a
                    // right-aligned partial row.
                    const isRightmost = startCol + physicalCol === COLS - 1;

                    return (
                      <div
                        key={step.title}
                        style={{ gridColumnStart: startCol + physicalCol + 1 }}
                        className="relative flex flex-col items-start gap-4"
                      >
                        <motion.div
                          ref={(el: HTMLDivElement | null) => {
                            nodeRefs.current[i] = el;
                          }}
                          initial={{ opacity: 0, scale: 0.6 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, amount: 0.6 }}
                          transition={{ duration: 0.4, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                          className="relative z-10 h-12 w-12 rounded-full bg-ink-soft border border-violet/50 flex items-center justify-center shrink-0 shadow-[0_0_0_6px_rgba(20,14,30,1)]"
                        >
                          <Icon className="h-5 w-5 text-lilac" strokeWidth={1.8} />
                        </motion.div>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, amount: 0.6 }}
                          transition={{ duration: 0.4, delay: i * 0.15 + 0.1, ease: [0.16, 1, 0.3, 1] }}
                          className={isRightmost ? "max-w-[160px]" : "max-w-[85%]"}
                        >
                          <h3 className="font-display text-lg text-cream">{step.title}</h3>
                          <p className="mt-1.5 text-sm text-mist/55 leading-relaxed">{step.body}</p>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* mobile: icons stacked in a centered column, connector zigzags
            side to side between them instead of running straight down */}
        {/* mobile: icons stacked in a centered column, connector zigzags
    side to side between them instead of running straight down */}
        <div
          ref={mobileContainerRef}
          className="md:hidden mt-10 relative max-w-xs mx-auto"
        >
          <svg
            className="absolute inset-0 pointer-events-none overflow-visible"
            width={mobileSvgSize.width}
            height={mobileSvgSize.height}
          >
            <defs>
              <linearGradient
                id="mobilePipelineGradient"
                x1="0"
                y1="0"
                x2="0"
                y2={mobileSvgSize.height}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#7B4DB5" />
                <stop offset="55%" stopColor="#5D2E8C" />
                <stop offset="100%" stopColor="#3FA98A" />
              </linearGradient>
            </defs>

            {mobilePathD && (
              <>
                <path
                  d={mobilePathD}
                  fill="none"
                  stroke="url(#mobilePipelineGradient)"
                  strokeWidth={20}
                  strokeLinecap="round"
                  opacity={0.15}
                  style={{ filter: "blur(8px)" }}
                />
                <motion.path
                  d={mobilePathD}
                  fill="none"
                  stroke="url(#mobilePipelineGradient)"
                  strokeWidth={9}
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 1.8, ease: "easeInOut" }}
                />
                <path
                  d={mobilePathD}
                  fill="none"
                  stroke="#F1E9FA"
                  strokeOpacity={0.5}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray="2 20"
                  className="pipeline-flow"
                />
              </>
            )}
          </svg>


          <div className="flex flex-col items-center gap-12">
            {(pipeline as PipelineItem[]).map((step, i) => {
              const Icon = step.icon ?? DEFAULT_ICONS[i % DEFAULT_ICONS.length];
              return (
                <div
                  key={step.title}
                  className="relative z-10 flex flex-col items-center text-center gap-14"
                >
                  <motion.div
                    ref={(el: HTMLDivElement | null) => {
                      mobileNodeRefs.current[i] = el;
                    }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.4, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="h-12 w-12 rounded-full bg-ink-soft border border-violet/50 flex items-center justify-center shrink-0 shadow-[0_0_0_6px_rgba(20,14,30,1)]"
                  >
                    <Icon className="h-5 w-5 text-lilac" strokeWidth={1.8} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.6 }}
                    transition={{ duration: 0.4, delay: i * 0.15 + 0.1, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <h3 className="font-display text-xl text-cream">{step.title}</h3>
                    <p className="mt-1.5 text-sm text-mist/55 leading-relaxed">
                      {step.body}
                    </p>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </div>

        <p className="mt-16 text-mist/50 text-sm max-w-md mx-auto md:mx-0 text-center md:text-left">
          No unnecessary switching. No disconnected systems. No operational
          confusion.{" "}
          <span className="text-cream/90">
            That&apos;s exactly what our Custom LMS Software does.
          </span>
        </p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex justify-center md:justify-start"
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
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes pipelineFlow {
          to {
            stroke-dashoffset: -104;
          }
        }
        .pipeline-flow {
          animation: pipelineFlow 3s linear infinite;
        }

        .pipeline-comet {
          position: absolute;
          top: 0;
          left: 0;
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            #ffffff 0%,
            #f1e9fa 45%,
            transparent 75%
          );
          box-shadow: 0 0 18px 5px rgba(241, 233, 250, 0.75);
          offset-path: path("${pathD}");
          offset-rotate: 0deg;
          animation: cometMove 4s linear infinite;
        }
        @keyframes cometMove {
          from {
            offset-distance: 0%;
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          to {
            offset-distance: 100%;
            opacity: 0;
          }
        }

        /* mobile: comet travels along the zigzag connector path, same
           easing as the desktop comet */
        .mobile-pipeline-comet {
          position: absolute;
          top: 0;
          left: 0;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: radial-gradient(
            circle,
            #ffffff 0%,
            #f1e9fa 45%,
            transparent 75%
          );
          box-shadow: 0 0 16px 4px rgba(241, 233, 250, 0.75);
          offset-rotate: 0deg;
          animation: cometMove 4s linear infinite;
        }

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
          .pipeline-flow,
          .pipeline-comet,
          .mobile-pipeline-comet,
          .cta-pulse {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}