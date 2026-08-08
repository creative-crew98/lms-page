// components/ConsultationForm.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useFormModal } from "./FormModalContext";

// 👇 paste your Apps Script deployment URL here
const GOOGLE_SHEET_ENDPOINT = "https://script.google.com/macros/s/AKfycbxLJS5OkHXk_f0ic8pUIp184yzQh2kFZK9Wd3b_A_JcJigJQKW0K4L5vKgGvgksHmpL/exec";

// 👇 WhatsApp redirect target
const WHATSAPP_NUMBER = "919899669649"; // country code + number, no + or spaces
const WHATSAPP_MESSAGE = "Hi, I need a custom LMS for my business.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

type Status = "idle" | "submitting" | "success" | "error";
type FormState = { name: string; phone: string; email: string; bestTimeToCall: string; message: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-().]{7,15}$/;

// 9 AM – 7 PM, in 2-hour call windows.
const CALL_TIME_SLOTS = [
    "9:00 AM - 11:00 AM",
    "11:00 AM - 1:00 PM",
    "1:00 PM - 3:00 PM",
    "3:00 PM - 5:00 PM",
    "5:00 PM - 7:00 PM",
];

const inputStyle = {
    backgroundColor: "rgba(43,27,61,0.6)",
    border: "1px solid rgba(184,154,220,0.2)",
    color: "#F1E9FA",
};

const inputErrorStyle = {
    backgroundColor: "rgba(43,27,61,0.6)",
    border: "1px solid rgba(248,113,113,0.6)",
    color: "#F1E9FA",
};

function validate(form: FormState): FormErrors {
    const errors: FormErrors = {};
    if (!form.name.trim()) errors.name = "Please enter your name.";
    if (!form.phone.trim()) {
        errors.phone = "Please enter your phone number.";
    } else if (!PHONE_RE.test(form.phone.trim())) {
        errors.phone = "That doesn't look like a valid phone number.";
    }
    if (!form.email.trim()) {
        errors.email = "Please enter your email.";
    } else if (!EMAIL_RE.test(form.email.trim())) {
        errors.email = "That doesn't look like a valid email.";
    }
    // bestTimeToCall is optional — no validation.
    return errors;
}

export default function ConsultationForm() {
    const { isOpen, close } = useFormModal();
    const [status, setStatus] = useState<Status>("idle");
    const [form, setForm] = useState<FormState>({ name: "", phone: "", email: "", bestTimeToCall: "", message: "" });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
    const firstFieldRef = useRef<HTMLInputElement>(null);

    // focus the first field when the modal opens, and reset state when it closes
    useEffect(() => {
        if (isOpen) {
            const t = setTimeout(() => firstFieldRef.current?.focus(), 50);
            return () => clearTimeout(t);
        } else {
            setStatus("idle");
            setErrors({});
            setTouched({});
        }
    }, [isOpen]);

    // close on Escape (but not mid-submit, so an in-flight request isn't silently lost)
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape" && status !== "submitting") close();
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, status, close]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (touched[name as keyof FormState]) {
            setErrors((prev) => ({ ...validate({ ...form, [name]: value }) }));
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name } = e.target;
        setTouched((prev) => ({ ...prev, [name]: true }));
        setErrors(validate(form));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationErrors = validate(form);
        setErrors(validationErrors);
        setTouched({ name: true, phone: true, email: true, bestTimeToCall: true, message: true });
        if (Object.keys(validationErrors).length > 0) return;

        setStatus("submitting");

        try {
            // no-cors is required for Apps Script web apps from the browser
            await fetch(GOOGLE_SHEET_ENDPOINT, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(form),
            });

            setStatus("success");
            setForm({ name: "", phone: "", email: "", bestTimeToCall: "", message: "" });
            setTouched({});

            // Redirect to WhatsApp after a short pause so the person sees the success state.
            setTimeout(() => {
                window.location.href = WHATSAPP_URL;
            }, 1200);
        } catch (err) {
            console.error(err);
            setStatus("error");
        }
    };

    const fieldClass = (name: keyof FormState) =>
        "w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-[#B89ADC]";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ backgroundColor: "rgba(10,6,18,0.75)", backdropFilter: "blur(4px)" }}
                    onClick={() => status !== "submitting" && close()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="consultation-form-title"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="relative w-full max-w-md rounded-2xl p-6 sm:p-8"
                        style={{
                            backgroundColor: "#241934",
                            border: "1px solid rgba(184,154,220,0.15)",
                            boxShadow: "0 25px 70px rgba(0,0,0,0.5)",
                        }}
                    >
                        <button
                            onClick={close}
                            disabled={status === "submitting"}
                            aria-label="Close"
                            className="absolute top-4 right-4 rounded-full p-1.5 transition-colors hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ color: "rgba(241,233,250,0.6)" }}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {status === "success" ? (
                            <div
                                className="flex flex-col items-center justify-center gap-3 py-10 text-center"
                                role="status"
                                aria-live="polite"
                            >
                                <CheckCircle2 className="h-10 w-10" style={{ color: "#B89ADC" }} />
                                <p className="font-display text-lg" style={{ color: "#F1E9FA" }}>
                                    Thanks! Redirecting you to WhatsApp&hellip;
                                </p>
                            </div>
                        ) : (
                            <>
                                <h3
                                    id="consultation-form-title"
                                    className="font-display text-xl sm:text-2xl"
                                    style={{ color: "#F1E9FA" }}
                                >
                                    Book Your Free Consultation
                                </h3>
                                <p className="mt-1.5 text-sm" style={{ color: "rgba(241,233,250,0.6)" }}>
                                    Tell us a bit about your coaching business.
                                </p>

                                <form onSubmit={handleSubmit} noValidate className="mt-6 flex flex-col gap-4">
                                    <div>
                                        <input
                                            ref={firstFieldRef}
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            required
                                            autoComplete="name"
                                            placeholder="Full name"
                                            aria-label="Full name"
                                            aria-invalid={!!errors.name}
                                            disabled={status === "submitting"}
                                            className={fieldClass("name")}
                                            style={touched.name && errors.name ? inputErrorStyle : inputStyle}
                                        />
                                        {touched.name && errors.name && (
                                            <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "#f87171" }}>
                                                <AlertCircle className="h-3 w-3 shrink-0" />
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            name="phone"
                                            value={form.phone}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            required
                                            type="tel"
                                            autoComplete="tel"
                                            placeholder="Phone number"
                                            aria-label="Phone number"
                                            aria-invalid={!!errors.phone}
                                            disabled={status === "submitting"}
                                            className={fieldClass("phone")}
                                            style={touched.phone && errors.phone ? inputErrorStyle : inputStyle}
                                        />
                                        {touched.phone && errors.phone && (
                                            <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "#f87171" }}>
                                                <AlertCircle className="h-3 w-3 shrink-0" />
                                                {errors.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <input
                                            name="email"
                                            value={form.email}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            required
                                            type="email"
                                            autoComplete="email"
                                            placeholder="Email address"
                                            aria-label="Email address"
                                            aria-invalid={!!errors.email}
                                            disabled={status === "submitting"}
                                            className={fieldClass("email")}
                                            style={touched.email && errors.email ? inputErrorStyle : inputStyle}
                                        />
                                        {touched.email && errors.email && (
                                            <p className="mt-1.5 flex items-center gap-1 text-xs" style={{ color: "#f87171" }}>
                                                <AlertCircle className="h-3 w-3 shrink-0" />
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="bestTimeToCall"
                                            className="mb-1.5 block text-xs"
                                            style={{ color: "rgba(241,233,250,0.6)" }}
                                        >
                                            Best time to call (9 AM – 7 PM)
                                        </label>
                                        <select
                                            id="bestTimeToCall"
                                            name="bestTimeToCall"
                                            value={form.bestTimeToCall}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            aria-label="Best time to call"
                                            disabled={status === "submitting"}
                                            className={fieldClass("bestTimeToCall")}
                                            style={inputStyle}
                                        >
                                            <option value="" style={{ color: "#1E1C2F" }}>
                                                Select a time slot (optional)
                                            </option>
                                            {CALL_TIME_SLOTS.map((slot) => (
                                                <option key={slot} value={slot} style={{ color: "#1E1C2F" }}>
                                                    {slot}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <textarea
                                        name="message"
                                        value={form.message}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="What are you looking to automate? (optional)"
                                        aria-label="What are you looking to automate? (optional)"
                                        disabled={status === "submitting"}
                                        className="resize-none w-full rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-[#B89ADC]"
                                        style={inputStyle}
                                    />

                                    <button
                                        type="submit"
                                        disabled={status === "submitting"}
                                        className="mt-2 flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-[#F1E9FA] bg-gradient-to-r from-[#5D2E8C] to-[#7B4DB5] transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                                    >
                                        {status === "submitting" ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            "Submit"
                                        )}
                                    </button>

                                    {status === "error" && (
                                        <p
                                            className="flex items-center justify-center gap-1.5 text-xs text-center"
                                            style={{ color: "#f87171" }}
                                            role="alert"
                                        >
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            Something went wrong. Please try again.
                                        </p>
                                    )}
                                </form>
                            </>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}