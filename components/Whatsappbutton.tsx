"use client";

import React, { useEffect, useState } from "react";

/**
 * Sticky WhatsApp button with an animated, auto-cycling message bubble.
 * Usage: import WhatsAppButton from "@/components/WhatsAppButton";
 * Then drop <WhatsAppButton /> anywhere in layout.tsx (e.g. right before </body>).
 */

const WHATSAPP_NUMBER = "919899669649"; // country code (91) + number, no + or spaces
const DEFAULT_MESSAGE =
    "Hi, I need a custom LMS for my business.";

const BUBBLE_TEXT = "Need a LMS? Chat with us on WhatsApp!";
const TYPE_SPEED = 45; // ms per character
const BUBBLE_VISIBLE_MS = 5000; // how long bubble stays fully shown
const BUBBLE_HIDDEN_MS = 4000; // gap before it reappears

export default function WhatsAppButton() {
    const [showBubble, setShowBubble] = useState(false);
    const [typedText, setTypedText] = useState("");

    const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        DEFAULT_MESSAGE
    )}`;

    // Cycle the bubble: appear -> type text -> hold -> disappear -> repeat
    useEffect(() => {
        let typingInterval: ReturnType<typeof setInterval>;
        let hideTimeout: ReturnType<typeof setTimeout>;

        const cycle = () => {
            setShowBubble(true);
            setTypedText("");

            let i = 0;
            typingInterval = setInterval(() => {
                i += 1;
                setTypedText(BUBBLE_TEXT.slice(0, i));
                if (i >= BUBBLE_TEXT.length) {
                    clearInterval(typingInterval);
                }
            }, TYPE_SPEED);

            hideTimeout = setTimeout(() => {
                setShowBubble(false);
            }, BUBBLE_VISIBLE_MS);
        };

        cycle(); // run once on mount
        const loop = setInterval(cycle, BUBBLE_VISIBLE_MS + BUBBLE_HIDDEN_MS);

        return () => {
            clearInterval(typingInterval);
            clearTimeout(hideTimeout);
            clearInterval(loop);
        };
    }, []);

    return (
        <div className="fixed bottom-10 right-5 z-50 flex items-center gap-3">
            {/* Animated text bubble */}
            <div
                className={`max-w-[220px] rounded-2xl rounded-br-sm bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-lg shadow-black/10 transition-all duration-500 ease-out ${showBubble
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-2 opacity-0"
                    }`}
            >
                {typedText}
                <span className="ml-0.5 inline-block w-[2px] animate-pulse bg-gray-400 align-middle">
                    &nbsp;
                </span>
            </div>

            {/* Button */}
            <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Chat with us on WhatsApp"
                className="group relative flex items-center"
            >
                {/* Pulsing ring */}
                <span className="absolute inline-flex h-14 w-14 animate-ping rounded-full bg-[#25D366] opacity-40" />

                {/* Icon circle */}
                <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-110">
                    <svg
                        viewBox="0 0 32 32"
                        fill="currentColor"
                        className="h-7 w-7 text-white"
                    >
                        <path d="M16.001 3C9.373 3 4 8.373 4 15c0 2.386.7 4.61 1.902 6.478L4 29l7.73-1.868A11.94 11.94 0 0 0 16.001 27C22.629 27 28 21.627 28 15S22.629 3 16.001 3zm0 21.75a9.72 9.72 0 0 1-4.955-1.354l-.355-.21-4.59 1.109 1.126-4.47-.232-.367A9.706 9.706 0 0 1 6.25 15c0-5.376 4.375-9.75 9.75-9.75S25.75 9.624 25.75 15 21.375 24.75 16.001 24.75zm5.373-7.31c-.294-.147-1.74-.858-2.009-.956-.27-.098-.467-.147-.663.147-.196.294-.76.956-.932 1.152-.171.196-.343.22-.637.073-.294-.147-1.243-.458-2.367-1.46-.875-.78-1.466-1.744-1.638-2.038-.171-.294-.018-.453.129-.6.132-.132.294-.343.442-.514.147-.171.196-.294.294-.49.098-.196.049-.368-.024-.514-.073-.147-.663-1.598-.908-2.188-.239-.575-.482-.497-.663-.507l-.564-.01c-.196 0-.514.073-.784.368-.27.294-1.03 1.006-1.03 2.454s1.055 2.847 1.202 3.043c.147.196 2.076 3.17 5.032 4.444.703.303 1.251.484 1.679.62.705.224 1.347.192 1.854.117.566-.084 1.74-.712 1.985-1.4.245-.688.245-1.278.171-1.4-.073-.123-.27-.196-.564-.343z" />
                    </svg>
                </span>
            </a>
        </div>
    );
}