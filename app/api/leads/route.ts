import { NextResponse } from "next/server";

const ENDPOINT = "https://script.google.com/macros/s/AKfycbwGA2mhBVjD_n5rWy6-4Y_jzcgRbxCzIbOz6W2dYkDcv9xCnJYqPkG4UZILP-gzBYmF/exec";

export async function POST(request: Request) {
    let data;
    try {
        data = await request.json();
    } catch {
        return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
    }
    if (!data || typeof data !== "object" || ![data.name, data.email, data.phone].every(
        value => typeof value === "string" && value.trim().length > 0
    )) {
        return NextResponse.json({ success: false, error: "Contact details are required." }, { status: 400 });
    }
    try {
        const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(20000),
            cache: "no-store",
        });
        if (!response.ok) throw new Error(`Google Sheets returned HTTP ${response.status}.`);
        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch {
            throw new Error("Google Sheets deployment did not return JSON. Check web app access and deployment version.");
        }
        if (result.success !== true) {
            const message = typeof result.error === "string" ? result.error : "Google Sheets did not confirm a save.";
            if (message === "Run setup first.") {
                throw new Error("Google Sheets is not configured. Run setup in Apps Script and authorize spreadsheet access.");
            }
            throw new Error(message);
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Could not save your details. Please try again.";
        console.error("[Lead submission]", message);
        return NextResponse.json({ success: false, error: message }, { status: 502 });
    }
}
