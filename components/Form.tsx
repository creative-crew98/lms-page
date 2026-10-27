"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { useFormModal } from "./FormModalContext";
import { answerCategory, buildLeadSignals, trackLmsEvent } from "./leadTracking";
import ConsultationBooking from "./ConsultationBooking";

const GOOGLE_SHEET_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbxbhjs5ij9LW1ALUF73E-QrNeenHxjGth6t1bzUL1Jl-_o988v_wGtDRL-JDqoWW9Tu/exec";

const CRM_ENDPOINT =
    "https://nuursmovhbhislrphakl.supabase.co/functions/v1/capture-lead";

const QUESTIONS = [
    {
        id: "role",
        title: "Which of these best describes you?",
        required: true,
        options: [
            "Coaching / Institute Owner",
            "Educator / Teacher",
            "Online Course Creator",
            "Trainer / Mentor",
            "EdTech Business Owner",
            "Other",
        ],
    },
    {
        id: "currentLms",
        title: "Do you currently use an LMS for your courses or students?",
        required: true,
        options: [
            "Yes, we already use an LMS",
            "No, we manage everything manually",
            "We use basic tools like WhatsApp/Google Drive",
            "We are planning to launch an LMS",
        ],
    },
    {
        id: "challenge",
        title: "What is the #1 challenge you currently face in managing your students/courses?",
        required: true,
        options: [
            "Student management",
            "Course/content management",
            "Online assessments & exams",
            "Tracking student performance",
            "Attendance & engagement",
            "Payments & subscriptions",
            "Too many tools/platforms",
            "Other",
        ],
    },
    {
        id: "goal",
        title: "What would you primarily like an LMS to help you achieve?",
        required: true,
        options: [
            "Manage courses in one place",
            "Automate student management",
            "Track student progress & performance",
            "Conduct tests & assessments",
            "Improve student engagement",
            "Sell courses online",
            "Scale my coaching/institute",
        ],
    },
    {
        id: "studentCount",
        title: "Approximately how many students do you currently manage?",
        required: true,
        options: ["1–100", "101–500", "501–1,000", "1,000–5,000", "5,000+"],
    },
    {
        id: "courseType",
        title: "What type of courses/training do you offer?",
        required: true,
        options: [
            "Academic / Coaching",
            "Professional Training",
            "Skill Development",
            "Competitive Exam Preparation",
            "Corporate Training",
            "Online Courses",
            "Other",
        ],
    },
    {
        id: "priority",
        title: "What is your biggest priority right now?",
        required: true,
        options: [
            "Reduce manual work",
            "Improve student experience",
            "Increase course enrollments",
            "Automate operations",
            "Track student performance",
            "Scale my institute/business",
        ],
    },
    {
        id: "implementationTimeline",
        title: "When are you planning to implement an LMS?",
        required: true,
        options: [
            "Immediately",
            "Within 1 month",
            "Within 3 months",
            "Within 6 months",
            "Just exploring options",
        ],
    },
];

type Status = "idle" | "submitting" | "success" | "error";
type FormState = { name: string; phone: string; email: string; message: string };
type FormErrors = Partial<Record<keyof FormState, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+]?[\d\s\-().]{7,15}$/;

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

    return errors;
}

// Existing Google Apps Script save. It expects a JSON response.
async function saveLeadToSheet(payload: Record<string, unknown>) {
    const response = await fetch(GOOGLE_SHEET_ENDPOINT, {
        signal: AbortSignal.timeout(20000),
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: JSON.stringify(payload),
    });

    if (!response.headers.get("content-type")?.includes("application/json")) {
        throw new Error("The form service is unavailable. Please try again later.");
    }

    const result = await response.json();

    if (!response.ok || result.success !== true) {
        throw new Error(result.error || "The form could not be saved to the sheet.");
    }
}

// CRM save. Uses the same event ID on retry to avoid creating duplicate leads.
async function saveLeadToCrm(payload: Record<string, unknown>) {
    const response = await fetch(CRM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok || result.error) {
        throw new Error(result.error || "The lead could not be saved to CRM.");
    }
}

export default function ConsultationForm() {
    const { isOpen, close } = useFormModal();

    const [status, setStatus] = useState<Status>("idle");
    const [submissionError, setSubmissionError] = useState("");
    const [form, setForm] = useState<FormState>({
        name: "",
        phone: "",
        email: "",
        message: "",
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [touched, setTouched] = useState<
        Partial<Record<keyof FormState, boolean>>
    >({});
    const [step, setStep] = useState(-1);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [questionError, setQuestionError] = useState("");
    const [bookingBusy, setBookingBusy] = useState(false);

    const questionRef = useRef<HTMLHeadingElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const firstFieldRef = useRef<HTMLInputElement>(null);
    const eventIdRef = useRef<string | null>(null);
    const startedRef = useRef(false);
    const savingRef = useRef(false);
    const completedRef = useRef(false);

    const question = QUESTIONS[step];
    const onContactStep = step === -1;

    function ensureLeadId() {
        if (!eventIdRef.current) {
            eventIdRef.current = `lms_lead_${crypto.randomUUID()}`;
        }
        return eventIdRef.current;
    }

    useEffect(() => {
        if (!isOpen) return;

        if (!startedRef.current) {
            startedRef.current = true;
            trackLmsEvent("LMSQuizStart", {
                content_name: "lms_consultation",
                total_questions: QUESTIONS.length,
            });
        }

        modalRef.current?.scrollTo({ top: 0, behavior: "instant" });

        if (onContactStep) {
            firstFieldRef.current?.focus({ preventScroll: true });
        } else {
            questionRef.current?.focus({ preventScroll: true });
        }
    }, [step, isOpen, onContactStep]);

    // Save partial contact details to Google Sheets while the visitor fills out
    // the form. The CRM receives the lead after the questionnaire is completed.
    useEffect(() => {
        if (!isOpen || !eventIdRef.current) return;
        if (!Object.values(form).some((value) => value.trim())) return;

        const timer = setTimeout(() => {
            void saveLeadToSheet({
                ...form,
                eventId: eventIdRef.current,
                leadId: eventIdRef.current,
                action: "lead",
                submissionStage: "contact",
            }).catch((error) => {
                console.warn("Partial contact details could not be saved yet.", error);
            });
        }, 350);

        return () => clearTimeout(timer);
    }, [form, isOpen]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => firstFieldRef.current?.focus(), 50);
            return () => clearTimeout(timer);
        }

        if (completedRef.current) {
            completedRef.current = false;
            setForm({ name: "", phone: "", email: "", message: "" });
            setAnswers({});
            eventIdRef.current = null;
        }

        startedRef.current = false;
        setStatus("idle");
        setStep(-1);
        setQuestionError("");
        setErrors({});
        setTouched({});
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && status !== "submitting" && !bookingBusy) {
                close();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, status, bookingBusy, close]);

    const handleChange = (
        event: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = event.target;

        if (value.trim()) ensureLeadId();

        setForm((previous) => ({ ...previous, [name]: value }));

        if (touched[name as keyof FormState]) {
            setErrors(validate({ ...form, [name]: value }));
        }
    };

    const handleBlur = (
        event: React.FocusEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name } = event.target;
        setTouched((previous) => ({ ...previous, [name]: true }));
        setErrors(validate(form));
    };

    async function submitCompleted(completedAnswers: Record<string, string>) {
        const missing = QUESTIONS.findIndex((item) => !completedAnswers[item.id]);

        if (missing >= 0) {
            setStep(missing);
            setQuestionError("Please select an answer.");
            return;
        }

        const validationErrors = validate(form);

        if (Object.keys(validationErrors).length) {
            setErrors(validationErrors);
            setTouched({ name: true, phone: true, email: true });
            setStep(-1);
            return;
        }

        const signals = buildLeadSignals(completedAnswers);
        const eventId = ensureLeadId();

        const answerSummary = QUESTIONS.map(
            (item) => `${item.title}: ${completedAnswers[item.id] || ""}`
        ).join("\n");

        const message = [
            form.message.trim(),
            "Consultation questionnaire:",
            answerSummary,
        ]
            .filter(Boolean)
            .join("\n\n")
            .slice(0, 2000);

        const sheetPayload = {
            ...form,
            eventId,
            leadId: eventId,
            action: "lead",
            submissionStage: "completed",
            leadSegment: signals.lead_segment,
            leadScore: signals.lead_score,
            answers: completedAnswers,
            ...completedAnswers,
        };

        const crmPayload = {
            external_lead_id: eventId,
            name: form.name.trim(),
            phone: form.phone.trim(),
            email: form.email.trim().toLowerCase(),
            service_name: "LMS",
            lead_source: "LMS",
            message,
            landing_page_url: window.location.href,
        };

        completedRef.current = true;
        setStatus("success");
        setSubmissionError("");

        // Keep the booking screen available while both saves complete.
        void Promise.all([
            saveLeadToSheet(sheetPayload),
            saveLeadToCrm(crmPayload),
        ])
            .then(() => {
                trackLmsEvent(
                    "Lead",
                    { ...signals, submission_stage: "completed" },
                    false,
                    eventId
                );
                trackLmsEvent(
                    "LMSQuizComplete",
                    signals,
                    true,
                    `quiz_${eventId}`
                );
                trackLmsEvent(
                    `LMSLead_${signals.lead_segment}`,
                    signals,
                    true,
                    `segment_${eventId}`
                );

                if (signals.lead_segment === "hot") {
                    trackLmsEvent(
                        "LMSHighIntentLead",
                        signals,
                        true,
                        `intent_${eventId}`
                    );
                }
            })
            .catch((error) => {
                setSubmissionError(
                    error instanceof Error
                        ? error.message
                        : "Your details could not be saved to the Sheet and CRM."
                );
                console.warn("Completed lead save failed; booking remains available.", error);
            });
    }

    const chooseAnswer = async (option: string) => {
        if (savingRef.current || !question) return;

        const nextAnswers = { ...answers, [question.id]: option };
        setAnswers(nextAnswers);
        setQuestionError("");
        setSubmissionError("");

        if (step === QUESTIONS.length - 1) {
            submitCompleted(nextAnswers);
            return;
        }

        trackLmsEvent("LMSQuizStep", {
            question_id: question.id,
            step: step + 1,
            answer: answerCategory(option),
            content_name: "lms_consultation",
        });

        setStatus("idle");
        setStep((current) => current + 1);
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();

        if (savingRef.current) return;

        if (onContactStep) {
            const validationErrors = validate(form);
            setErrors(validationErrors);
            setTouched({ name: true, phone: true, email: true, message: true });

            if (Object.keys(validationErrors).length) return;

            const leadId = ensureLeadId();
            setStatus("idle");
            setStep(0);

            void saveLeadToSheet({
                ...form,
                eventId: leadId,
                leadId,
                action: "lead",
                submissionStage: "contact",
            }).catch((error) => {
                console.warn(
                    "Contact details are being retried by subsequent answer saves.",
                    error
                );
            });
        } else if (status === "error" && question && answers[question.id]) {
            void chooseAnswer(answers[question.id]);
        }
    };

    const fieldClass = (_name: keyof FormState) =>
        "w-full rounded-lg px-4 py-3 text-base outline-none transition-colors focus:border-[#B89ADC]";

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden p-3 sm:p-4"
                    style={{
                        backgroundColor: "rgba(10,6,18,0.75)",
                        backdropFilter: "blur(4px)",
                    }}
                    onClick={() => status !== "submitting" && !bookingBusy && close()}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="consultation-form-title"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        onClick={(event) => event.stopPropagation()}
                        ref={modalRef}
                        className="relative w-full min-w-0 max-w-md max-h-[calc(100dvh-1.5rem)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-2xl p-4 sm:p-8"
                        style={{
                            backgroundColor: "#241934",
                            border: "1px solid rgba(184,154,220,0.15)",
                            boxShadow: "0 25px 70px rgba(0,0,0,0.5)",
                        }}
                    >
                        <button
                            onClick={close}
                            disabled={status === "submitting" || bookingBusy}
                            aria-label="Close"
                            className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ color: "rgba(241,233,250,0.6)" }}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        {status === "success" ? (
                            <>
                                <ConsultationBooking
                                    endpoint={GOOGLE_SHEET_ENDPOINT}
                                    payload={{
                                        ...form,
                                        answers,
                                        ...answers,
                                        leadId: eventIdRef.current,
                                        eventId: eventIdRef.current,
                                        submissionStage: "completed",
                                        ...(() => {
                                            const signals = buildLeadSignals(answers);
                                            return {
                                                leadSegment: signals.lead_segment,
                                                leadScore: signals.lead_score,
                                            };
                                        })(),
                                    }}
                                    onBusyChange={setBookingBusy}
                                    onBack={() => {
                                        setStatus("idle");
                                        setStep(QUESTIONS.length - 1);
                                    }}
                                />
                                {submissionError && (
                                    <p role="status" className="px-1 text-xs text-amber-200">
                                        {submissionError} Booking is still available.
                                    </p>
                                )}
                            </>
                        ) : (
                            <>
                                <h3
                                    id="consultation-form-title"
                                    className="font-display text-xl sm:text-2xl"
                                    style={{ color: "#F1E9FA" }}
                                >
                                    Book Your Free Consultation
                                </h3>
                                <p
                                    className="mt-1.5 text-sm"
                                    style={{ color: "rgba(241,233,250,0.6)" }}
                                >
                                    Tell us a bit about your coaching business.
                                </p>

                                <form
                                    onSubmit={handleSubmit}
                                    noValidate
                                    className="mt-6 flex min-w-0 flex-col gap-4"
                                >
                                    <p className="text-xs text-[#B89ADC]" aria-live="polite">
                                        {onContactStep
                                            ? "Step 1: Your contact details"
                                            : `Question ${step + 1} of ${QUESTIONS.length}`}
                                    </p>

                                    {!onContactStep ? (
                                        <>
                                            <p className="text-sm text-[#B89ADC]">
                                                Select an answer to move to the next question.
                                            </p>

                                            <h4
                                                ref={questionRef}
                                                tabIndex={-1}
                                                className="text-lg font-semibold text-white outline-none"
                                                id="lms-question"
                                            >
                                                {question.title}
                                                {question.required ? (
                                                    <span className="whitespace-nowrap"> *</span>
                                                ) : (
                                                    <span className="whitespace-nowrap"> (optional)</span>
                                                )}
                                            </h4>

                                            <div
                                                role="group"
                                                aria-labelledby="lms-question"
                                                className="flex min-w-0 flex-col gap-2"
                                            >
                                                {question.options.map((option) => (
                                                    <button
                                                        type="button"
                                                        key={option}
                                                        disabled={status === "submitting"}
                                                        aria-pressed={answers[question.id] === option}
                                                        onClick={() => chooseAnswer(option)}
                                                        className="flex min-h-12 min-w-0 items-center gap-3 rounded-lg border p-3 text-left text-base text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B89ADC] disabled:opacity-60"
                                                        style={{
                                                            borderColor:
                                                                answers[question.id] === option
                                                                    ? "#B89ADC"
                                                                    : "rgba(184,154,220,0.2)",
                                                        }}
                                                    >
                                                        <span
                                                            aria-hidden="true"
                                                            className="h-4 w-4 shrink-0 rounded-full border border-[#B89ADC]"
                                                            style={{
                                                                backgroundColor:
                                                                    answers[question.id] === option
                                                                        ? "#B89ADC"
                                                                        : "transparent",
                                                            }}
                                                        />
                                                        <span className="min-w-0 break-words">{option}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {questionError && (
                                                <p role="alert" className="text-sm text-red-400">
                                                    {questionError}
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <>
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
                                                    style={
                                                        touched.name && errors.name
                                                            ? inputErrorStyle
                                                            : inputStyle
                                                    }
                                                />
                                                {touched.name && errors.name && (
                                                    <p
                                                        className="mt-1.5 flex items-center gap-1 text-xs"
                                                        style={{ color: "#f87171" }}
                                                    >
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
                                                    style={
                                                        touched.phone && errors.phone
                                                            ? inputErrorStyle
                                                            : inputStyle
                                                    }
                                                />
                                                {touched.phone && errors.phone && (
                                                    <p
                                                        className="mt-1.5 flex items-center gap-1 text-xs"
                                                        style={{ color: "#f87171" }}
                                                    >
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
                                                    style={
                                                        touched.email && errors.email
                                                            ? inputErrorStyle
                                                            : inputStyle
                                                    }
                                                />
                                                {touched.email && errors.email && (
                                                    <p
                                                        className="mt-1.5 flex items-center gap-1 text-xs"
                                                        style={{ color: "#f87171" }}
                                                    >
                                                        <AlertCircle className="h-3 w-3 shrink-0" />
                                                        {errors.email}
                                                    </p>
                                                )}
                                            </div>

                                            <textarea
                                                name="message"
                                                value={form.message}
                                                onChange={handleChange}
                                                rows={3}
                                                placeholder="What are you looking to automate? (optional)"
                                                aria-label="What are you looking to automate? (optional)"
                                                disabled={status === "submitting"}
                                                className="resize-none w-full rounded-lg px-4 py-3 text-base outline-none transition-colors focus:border-[#B89ADC]"
                                                style={inputStyle}
                                            />
                                        </>
                                    )}

                                    {!onContactStep && (
                                        <button
                                            type="button"
                                            disabled={status === "submitting"}
                                            onClick={() => {
                                                setStep((current) => current - 1);
                                                setQuestionError("");
                                            }}
                                            className="min-h-11 text-left text-sm text-[#B89ADC] disabled:opacity-50"
                                        >
                                            Back
                                        </button>
                                    )}

                                    {onContactStep && (
                                        <button
                                            type="submit"
                                            disabled={status === "submitting"}
                                            className="mt-2 min-h-12 rounded-full bg-gradient-to-r from-[#5D2E8C] to-[#7B4DB5] px-6 py-3.5 text-base font-semibold text-[#F1E9FA] disabled:opacity-50"
                                        >
                                            Start questions
                                        </button>
                                    )}

                                    {status === "submitting" && (
                                        <p
                                            role="status"
                                            className="flex items-center justify-center gap-2 text-sm text-[#B89ADC]"
                                        >
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Saving your answers...
                                        </p>
                                    )}

                                    {status === "error" && !onContactStep && (
                                        <button
                                            type="submit"
                                            className="min-h-12 rounded-full bg-[#7B4DB5] px-6 py-3 text-base font-semibold text-white"
                                        >
                                            Retry saving answers
                                        </button>
                                    )}

                                    {status === "error" && (
                                        <p
                                            className="flex items-center justify-center gap-1.5 text-center text-xs"
                                            style={{ color: "#f87171" }}
                                            role="alert"
                                        >
                                            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                            {submissionError || "Something went wrong. Please try again."}
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