"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Loader2, RefreshCw } from "lucide-react";

type Day = { date: string; times: string[] };
type Booking = { date: string; time: string };
const labels: Record<string, string> = { "10:30": "10:30 AM", "12:00": "12:00 PM", "13:30": "1:30 PM", "15:00": "3:00 PM", "16:30": "4:30 PM", "18:00": "6:00 PM" };
const displayDay = (date: string) => new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"));
export default function ConsultationBooking({ endpoint, payload, onBusyChange, onBack }: { endpoint: string; payload: Record<string, unknown>; onBusyChange: (busy: boolean) => void; onBack: () => void }) {
    const [days, setDays] = useState<Day[]>([]), [date, setDate] = useState(""), [time, setTime] = useState("");
    const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState("");
    const [booking, setBooking] = useState<Booking | null>(null);
    const saving = useRef(false), generation = useRef(0);
    const load = useCallback(async () => {
        const token = ++generation.current;
        try {
            const url = new URL(endpoint); url.searchParams.set("action", "availability"); url.searchParams.set("_", String(Date.now()));
            const response = await fetch(url.toString(), { signal: AbortSignal.timeout(20000) });
            if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("The booking service is temporarily unavailable.");
            const result = await response.json();
            if (!response.ok || result.success !== true || !Array.isArray(result.dates)) throw new Error(result.error || "Available times could not be loaded.");
            const available: Day[] = result.dates.filter((day: Day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date) && Array.isArray(day.times)).map((day: Day) => ({ date: day.date, times: day.times.filter(value => Boolean(labels[value])) }));
            if (token !== generation.current) return;
            setDays(available);
            setDate(previous => available.some(day => day.date === previous) ? previous : available.find(day => day.times.length)?.date || available[0]?.date || "");
            setError("");
        } catch (issue) { if (token === generation.current) { setError(issue instanceof Error ? issue.message : "Available times could not be loaded."); setDays([]); } }
        finally { if (token === generation.current) setLoading(false); }
    }, [endpoint]);
    useEffect(() => {
        if (booking) return;
        void load();
        const invalidate = () => { generation.current++; };
        const timer = setInterval(() => { if (!saving.current && !booking && document.visibilityState === "visible") void load(); }, 20000);
        return () => { clearInterval(timer); invalidate(); };
    }, [load, booking]);
    const selectedDay = days.find(day => day.date === date);
    const selected = Boolean(time && selectedDay?.times.includes(time));
    async function reserve() {
        if (saving.current || !selected) return;
        saving.current = true; setBusy(true); onBusyChange(true); setError("");
        generation.current++;
        try {
            const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=UTF-8" }, body: JSON.stringify({ ...payload, action: "book", bookingDate: date, bookingTime: time }), signal: AbortSignal.timeout(20000) });
            if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("The booking service is temporarily unavailable.");
            const result = await response.json();
            if (!response.ok || result.success !== true || !result.booked) {
                if (result.code === "SLOT_TAKEN") { setTime(""); await load(); }
                throw new Error(result.error || "Your time could not be booked. Please retry.");
            }
            if (!/^\d{4}-\d{2}-\d{2}$/.test(result.date) || !labels[result.time]) throw new Error("Booking confirmation is invalid. Please retry.");
            setBooking({ date: result.date, time: result.time });
        } catch (issue) { setError(issue instanceof Error ? issue.message : "Booking failed. Please retry."); }
        finally { saving.current = false; setBusy(false); onBusyChange(false); }
    }
    return <section className="flex min-w-0 flex-col gap-4 pt-5 text-[#F1E9FA]">
        <h3 id="consultation-form-title" className="flex items-center gap-2 text-xl font-semibold"><CalendarDays className="h-6 w-6 shrink-0"/>{booking ? "Consultation booked" : "Choose your consultation time"}</h3>
        {booking ? <div role="status" aria-live="polite" className="rounded-xl border border-[#B89ADC]/30 p-5"><CheckCircle2 className="mb-3 h-8 w-8 text-[#B89ADC]"/><p className="font-semibold">{displayDay(booking.date)}</p><p className="mt-1">{labels[booking.time]} IST</p><p className="mt-3 text-sm text-[#B89ADC]">Your contact details, answers and booked time have been saved.</p></div> : <>
            <p className="text-sm text-[#B89ADC]">Monday-Saturday. All times are in India Standard Time (IST). Booked times are hidden.</p>
            {loading ? <p role="status" className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/>Loading available times...</p> : days.length > 0 ? <>
                <label className="flex flex-col gap-2 text-sm">Date<select aria-label="Consultation date" value={date} disabled={busy} onChange={event => { setDate(event.target.value); setTime(""); }} className="min-h-12 w-full rounded-lg border border-[#B89ADC]/30 bg-[#241934] px-3 py-3 text-base text-white">{days.map(day => <option key={day.date} value={day.date} disabled={!day.times.length}>{displayDay(day.date)}{day.times.length ? "" : " - Fully booked"}</option>)}</select></label>
                <div aria-label="Available consultation times" role="group" className="grid grid-cols-2 gap-3">{selectedDay?.times.map(value => <button key={value} type="button" disabled={busy} aria-pressed={time === value} onClick={() => setTime(value)} className="min-h-12 rounded-lg border p-3 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B89ADC] disabled:opacity-50" style={{ borderColor: time === value ? "#B89ADC" : "rgba(184,154,220,0.3)", background: time === value ? "#5D2E8C" : "transparent" }}>{labels[value]}</button>)}</div>
                {!selectedDay?.times.length && <p className="text-sm text-[#B89ADC]">No times available on this date.</p>}
                <button type="button" disabled={busy || !selected} onClick={() => void reserve()} className="flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#7B4DB5] px-5 py-3 font-semibold disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin"/>}{busy ? "Booking..." : "Confirm time"}</button>
            </> : !error && <p className="text-sm text-[#B89ADC]">No consultation times are currently available.</p>}
            {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
            <div className="flex flex-wrap items-center justify-between gap-3"><button type="button" disabled={busy} onClick={onBack} className="min-h-11 text-sm text-[#B89ADC]">Back to answers</button><button type="button" disabled={busy || loading} onClick={() => void load()} className="flex min-h-11 items-center gap-2 text-sm text-[#B89ADC]"><RefreshCw size={15}/>Refresh times</button></div>
        </>}
    </section>;
}
