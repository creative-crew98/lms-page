"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  LayoutDashboard,
  Settings,
  Users,
  TrendingUp,
  BarChart3,
  Image as ImageIcon,
  MessageCircle,
  FileSpreadsheet,
  HardDrive,
} from "lucide-react";
import { useFormModal } from "./FormModalContext";
import TextType from "../Animation/TextType";
import LightPillar from "../Animation/LightPillar";
import excel from "../app/ICONS/excel.svg"
import googlesheet from "../app/ICONS/googlesheet.svg"
import whatsapp from "../app/ICONS/whatsapp.svg"
import drive from "../app/ICONS/googledrive.svg"
import website from "../app/tabsimage/website.png"
import Overview from "../app/tabsimage/overview2.jpeg"
import Userpannel from "../app/tabsimage/Userpannel.jpeg"
import Courses from "../app/tabsimage/Courses.jpeg"
import Anyalitcs from "../app/tabsimage/Anyalitcs.jpeg"

// Palette reference (from provided swatch):
// 01 Royal Purple    #2B1B3D
// 02 Deep Violet     #45225F
// 03 Amethyst Purple #5D2E8C
// 04 Lavender Dream  #7B4DB5
// 06 Lilac Mist      #B89ADC
// 07 Mauve Glow      #D6C1E8
// 09 Pastel Purple   #F1E9FA

const TABS = [
  {
    id: "website",
    label: "Website",
    icon: LayoutDashboard,
    accent: "#7B4DB5",
    image: website,
  },
  {
    id: "admin",
    label: "Admin Panel",
    icon: Settings,
    accent: "#5D2E8C",
    image: Overview,
  },
  {
    id: "user",
    label: "User Panel",
    icon: Users,
    accent: "#45225F",
    image: Userpannel,
  },
  {
    id: "progress",
    label: "Student Progress",
    icon: TrendingUp,
    accent: "#B89ADC",
    image: Courses,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart3,
    accent: "#D6C1E8",
    image: Anyalitcs,
  },
];

const getImageSrc = (image: string | { src: string }) =>
  typeof image === "string" ? image : image.src;

const PAIN_POINTS = [
  { id: "whatsapp", label: "", src: whatsapp.src },
  { id: "excel", label: "", src: excel.src },
  { id: "googlesheet", label: "", src: googlesheet.src },
  { id: "drive", label: "", src: drive.src },
];

const AUTO_ADVANCE_MS = 4000;

export default function Hero() {
  const { open } = useFormModal();
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReducedMotion) return;

    const maxScroll = 500;
    const maxScale = 1.15;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const progress = Math.min(window.scrollY / maxScroll, 1);
        setScale(1 + progress * (maxScale - 1));
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const [active, setActive] = useState(TABS[0].id);
  const activeIndex = TABS.findIndex((t) => t.id === active);
  const activeTab = TABS[activeIndex];

  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [imgError, setImgError] = useState(false);

  const autoAdvanceRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoAdvance = () => {
    if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    autoAdvanceRef.current = setInterval(() => {
      setActive((prev) => {
        const idx = TABS.findIndex((t) => t.id === prev);
        return TABS[(idx + 1) % TABS.length].id;
      });
    }, AUTO_ADVANCE_MS);
  };

  useEffect(() => {
    startAutoAdvance();
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [active]);

  useEffect(() => {
    const el = tabRefs.current[activeIndex];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
      const container = el.parentElement;
      if (container) {
        const elLeft = el.offsetLeft;
        const elRight = elLeft + el.offsetWidth;
        const visibleLeft = container.scrollLeft;
        const visibleRight = visibleLeft + container.clientWidth;
        if (elLeft < visibleLeft) {
          container.scrollTo({ left: elLeft - 12, behavior: "smooth" });
        } else if (elRight > visibleRight) {
          container.scrollTo({
            left: elRight - container.clientWidth + 12,
            behavior: "smooth",
          });
        }
      }
    }
  }, [activeIndex]);

  useEffect(() => {
    const handleResize = () => {
      const el = tabRefs.current[activeIndex];
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeIndex]);

  const selectTab = (index: number) => {
    const nextIndex = (index + TABS.length) % TABS.length;
    setActive(TABS[nextIndex].id);
    tabRefs.current[nextIndex]?.focus();
    startAutoAdvance();
  };

  const selectTabManually = (id: string) => {
    setActive(id);
    startAutoAdvance();
  };

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      selectTab(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      selectTab(index - 1);
    }
  };

  return (
    <section className="relative min-h-fit overflow-hidden bg-[#0a0612]">
      <div className="absolute inset-0 w-full h-full">
        <LightPillar
          topColor="#5227FF"
          bottomColor="#FF9FFC"
          intensity={1}
          rotationSpeed={0.3}
          glowAmount={0.003}
          pillarWidth={3}
          pillarHeight={0.4}
          noiseIntensity={0.01}
          pillarRotation={50}
          interactive={false}
          mixBlendMode="screen"
          quality="high"
        />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(55% 45% at 22% 15%, rgba(62,8,102,0.35) 0%, rgba(62,8,102,0) 70%), radial-gradient(50% 40% at 82% 75%, rgba(80,26,94,0.30) 0%, rgba(80,26,94,0) 70%), radial-gradient(70% 55% at 50% 0%, rgba(62,8,102,0.18) 0%, rgba(62,8,102,0) 70%)",
        }}
      />

      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.05]" aria-hidden="true">
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, #1E1C2F)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 md:px-10 pt-5  sm:pt-32 md:pt-40 pb-10 md:pb-14 text-center">
        <div
          className={`flex flex-wrap items-center justify-center gap-x-2 gap-y-2 mb-6 sm:mb-8 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
        >
          <span
            className=" text-[15px] sm:text-[20px] tracking-[0.2em] uppercase mt-0"
            style={{ color: "White" }}
          >
            Stop Managing Students On
          </span>
          <br />

          {PAIN_POINTS.map((point) => (
            <span
              key={point.id}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] sm:text-xs font-medium"
              style={{
                color: "#F1E9FA",
                backgroundColor: "rgba(255, 209, 209, 0.38)",
                border: "1px solid rgba(255, 61, 61, 0.38)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <span className="relative inline-flex h-5 w-5 shrink-0 items-center justify-center">
                <img
                  src={point.src}
                  alt=""
                  className="h-5 w-5 shrink-0 opacity-80"
                />
                <span
                  className="pointer-events-none absolute left-1/2 top-1/2 h-[2px] w-[26px] -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full"
                  style={{ backgroundColor: "#FF3D3D" }}
                  aria-hidden="true"
                />
              </span>
              {point.label}
            </span>
          ))}
        </div>

        <h1
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            color: "#F1E9FA",
            fontWeight: 600,
          }}
          className={`font-display  mt-10  text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1] sm:leading-[1.05] text-balance transition-all duration-75 will-change-transform ${mounted ? "opacity-100" : "opacity-0"
            }`}
        >
          <span style={{ color: "#FFD84D" }}>Automate</span> Entire Coaching
          With One
          <span
            className="relative inline-block text-md sm:text-3xl md:text-4xl lg:text-7xl align-middle"
            style={{ color: "#FFD84D" }}
          >
            Managment System
            <svg
              className="absolute left-0 -bottom-1. sm:-bottom-2 w-full overflow-visible"
              height="16"
              viewBox="0 0 300 16"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M2 8 C 40 -2, 80 18, 120 8 C 160 -2, 200 18, 240 8 C 265 3, 285 12, 298 6"
                stroke="#B89ADC"
                strokeWidth="8"
                strokeLinecap="round"
                fill="none"
                pathLength="1"
                className={`headline-underline ${mounted ? "headline-underline--looping" : ""}`}
              />
            </svg>
          </span>
        </h1>

        <div
          className={`mt-7 sm:mt-6 flex flex-col items-center justify-center transition-all duration-700 delay-100 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
        >
          <span
            className="font-display text-lg sm:text-2xl md:text-3xl"
            style={{ color: "rgba(241,233,250,0.75)" }}
          >
            Turn your coaching business into a
          </span>
          {mounted && (
            <TextType
              as="span"
              className="font-display italic"
              style={{
                fontSize: "clamp(1.25rem, 4vw, 2.25rem)",
                lineHeight: 1.1,
                fontWeight: 700,
              }}
              textColors={["#D6C1E8"]}
              text={["Scalable Platform", "Powerful Ecosystem", "Growth Engine"]}
              typingSpeed={65}
              deletingSpeed={35}
              pauseDuration={1800}
              loop
              showCursor
              cursorCharacter="|"
              cursorBlinkDuration={0.5}
              cursorClassName="text-[#D6C1E8]"
            />
          )}
        </div>

        {/* single, higher-emphasis CTA */}
        <div
          className={`mt-8 flex justify-center transition-all duration-700 delay-200 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            }`}
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
        </div>

        <div className="mt-5 md:mt-5">
          <div className="flex justify-center">
            <div
              role="tablist"
              aria-label="Platform features"
              className="no-scrollbar relative inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full p-1.5"
              style={{
                backgroundColor: "rgba(43,27,61,0.6)",
                border: "1px solid rgba(184,154,220,0.15)",
              }}
            >
              <span
                className="absolute top-1.5 bottom-1.5 rounded-full transition-all duration-300 ease-out"
                style={{
                  left: indicator.left,
                  width: indicator.width,
                  backgroundColor: activeTab.accent,
                  boxShadow: `0 4px 20px ${activeTab.accent}66`,
                }}
              />
              {TABS.map((tab, i) => {
                const Icon = tab.icon;
                const isActive = tab.id === active;
                return (
                  <button
                    key={tab.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    role="tab"
                    id={`tab-${tab.id}`}
                    aria-selected={isActive}
                    aria-controls={`panel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => selectTabManually(tab.id)}
                    onKeyDown={(e) => handleTabKeyDown(e, i)}
                    className="relative z-10 flex shrink-0 items-center gap-1.5 sm:gap-2 whitespace-nowrap rounded-full px-3.5 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors duration-300 outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={
                      {
                        color: isActive ? "#F1E9FA" : "rgba(184,154,220,0.65)",
                        "--tw-ring-color": activeTab.accent,
                        "--tw-ring-offset-color": "#1E1C2F",
                      } as React.CSSProperties
                    }
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div
            className="mt-2.5 mx-auto h-0.5 w-full max-w-[220px] rounded-full overflow-hidden"
            style={{ backgroundColor: "rgba(184,154,220,0.15)" }}
          >
            <div
              key={activeTab.id + "-progress"}
              className="h-full progress-bar"
              style={{ backgroundColor: activeTab.accent }}
            />
          </div>

          <div className="mt-2 relative">
            <div
              className="absolute -inset-4 rounded-3xl blur-2xl opacity-50 pointer-events-none transition-colors duration-500"
              style={{
                background: `radial-gradient(60% 60% at 50% 40%, ${activeTab.accent}59 0%, ${activeTab.accent}00 75%)`,
              }}
            />
            <div
              role="tabpanel"
              id={`panel-${activeTab.id}`}
              aria-labelledby={`tab-${activeTab.id}`}
              className="relative rounded-2xl overflow-hidden transition-colors duration-500 text-left"
              style={{
                border: `1px solid ${activeTab.accent}40`,
                backgroundColor: "#241934",
                boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              }}
            >
              <div
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3"
                style={{ borderBottom: "1px solid rgba(184,154,220,0.1)" }}
              >
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0" style={{ backgroundColor: "#7B4DB5" }} />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0" style={{ backgroundColor: "#5D2E8C" }} />
                <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full shrink-0" style={{ backgroundColor: "#45225F" }} />
                <span
                  className="ml-2 sm:ml-3 text-[10px] sm:text-xs font-mono truncate"
                  style={{ color: "rgba(184,154,220,0.5)" }}
                >
                  yourlms.com/{activeTab.id}
                </span>
              </div>

              <div key={activeTab.id} className="relative aspect-[16/9] panel-in bg-[#1a1224]">
                {imgError ? (
                  <div
                    className="w-full h-full flex flex-col items-center justify-center gap-3 px-6 text-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(93,46,140,0.15), rgba(43,27,61,0.4))",
                    }}
                  >
                    <ImageIcon
                      className="h-7 w-7 sm:h-8 sm:w-8"
                      style={{ color: "rgba(184,154,220,0.4)" }}
                    />
                    <span
                      className="text-[10px] sm:text-xs font-mono"
                      style={{ color: "rgba(184,154,220,0.45)" }}
                    >
                      Add your screenshot at {getImageSrc(activeTab.image)}
                    </span>
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={getImageSrc(activeTab.image)}
                    alt={activeTab.label}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes panelIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .panel-in {
          animation: panelIn 0.35s ease;
        }
        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        @keyframes progressFill {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        .progress-bar {
          width: 0%;
          animation: progressFill ${AUTO_ADVANCE_MS}ms linear;
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
          .panel-in,
          .progress-bar,
          .cta-pulse {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}