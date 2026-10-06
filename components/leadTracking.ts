export const LMS_PIXEL_ID = "1613294250158679";

type MetaEvent = { name: string; custom: boolean; params: Record<string, string | number>; eventId?: string };
type PixelWindow = Window & {
    fbq?: (...args: unknown[]) => void;
    __lmsMetaQueue?: MetaEvent[];
};

export function trackLmsEvent(name: string, params: Record<string, string | number>, custom = true, eventId?: string) {
    if (typeof window === "undefined") return;
    const target = window as PixelWindow;
    const event = { name, params, custom, eventId };
    try {
        if (!target.fbq) {
            (target.__lmsMetaQueue ??= []).push(event);
            return;
        }
        target.fbq(custom ? "trackSingleCustom" : "trackSingle", LMS_PIXEL_ID, name, params, ...(eventId ? [{ eventID: eventId }] : []));
    } catch (error) {
        console.error("[LMS Pixel] Event could not be queued", error);
    }
}

export function answerCategory(value: string | undefined) {
    return value ? value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") : "not_provided";
}

export function buildLeadSignals(answers: Record<string, string>) {
    // Initial business-intent heuristic; tune using actual sales outcomes.
    const timingScore: Record<string, number> = {
        "Immediately": 4, "Within 1 month": 3, "Within 3 months": 2,
        "Within 6 months": 1, "Just exploring options": 0,
    };
    const students = answers.studentCount || "";
    const studentScore = students.startsWith("5,000") || students.startsWith("1,000") ? 3
        : students.startsWith("501") ? 2 : students.startsWith("101") ? 1 : 0;
    const score = (timingScore[answers.implementationTimeline] ?? 0) + studentScore;
    const segment = score >= 5 ? "hot" : score >= 3 ? "warm" : "cold";
    return {
        content_name: "lms_consultation",
        role: answerCategory(answers.role),
        current_lms: answerCategory(answers.currentLms),
        challenge: answerCategory(answers.challenge),
        goal: answerCategory(answers.goal),
        student_count: answerCategory(students),
        course_type: answerCategory(answers.courseType),
        priority: answerCategory(answers.priority),
        implementation_timeline: answerCategory(answers.implementationTimeline),
        lead_score: score,
        lead_segment: segment,
    };
}
