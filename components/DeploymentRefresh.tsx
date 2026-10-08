"use client";

import { useEffect } from "react";

export default function DeploymentRefresh() {
    useEffect(() => {
        let checking = false;
        let disposed = false;
        const controller = new AbortController();
        const checkVersion = async () => {
            if (checking || document.visibilityState !== "visible") return;
            const currentScript = Array.from(document.scripts).find((script) =>
                script.src.includes("/_next/static/chunks/app/layout-")
            );
            if (!currentScript) return;
            checking = true;
            try {
                const url = new URL(window.location.href);
                url.searchParams.set("__lms_check", String(Date.now()));
                const response = await fetch(url, { cache: "no-store", signal: controller.signal });
                if (!response.ok) return;
                const html = await response.text();
                const page = new DOMParser().parseFromString(html, "text/html");
                const latestScript = Array.from(page.querySelectorAll("script[src]")).find((script) =>
                    script.getAttribute("src")?.includes("/_next/static/chunks/app/layout-")
                )?.getAttribute("src");
                if (disposed || !latestScript) return;
                if (new URL(latestScript, window.location.href).pathname !== new URL(currentScript.src).pathname) {
                    const freshUrl = new URL(window.location.href);
                    freshUrl.searchParams.set("__lms_update", String(Date.now()));
                    window.location.replace(freshUrl.href);
                }
            } catch {
                // Keep the current page usable if the connection is unavailable.
            } finally {
                checking = false;
            }
        };
        const onShow = () => { void checkVersion(); };
        const url = new URL(window.location.href);
        if (url.searchParams.has("__lms_update")) {
            url.searchParams.delete("__lms_update");
            window.history.replaceState(window.history.state, "", url.href);
        }
        const preparePage = async () => {
            // This landing page has no offline mode; retire workers left by older deployments.
            if ("serviceWorker" in navigator) {
                try {
                    const hadController = !!navigator.serviceWorker.controller;
                    const registrations = await navigator.serviceWorker.getRegistrations();
                    const results = await Promise.all(registrations
                        .filter((registration) => new URL(registration.scope).origin === window.location.origin
                            && window.location.href.startsWith(registration.scope))
                        .map((registration) => registration.unregister()));
                    if (results.some(Boolean) && "caches" in window) {
                        const names = await caches.keys();
                        await Promise.all(names
                            .filter((name) => /^(workbox-precache|next-|lms-)/i.test(name))
                            .map((name) => caches.delete(name)));
                    }
                    if (!disposed && hadController && results.some(Boolean)) {
                        const freshUrl = new URL(window.location.href);
                        freshUrl.searchParams.set("__lms_update", String(Date.now()));
                        window.location.replace(freshUrl.href);
                        return;
                    }
                } catch {
                    // Version checks still work if worker management is unavailable.
                }
            }
            if (!disposed) await checkVersion();
        };
        void preparePage();
        window.addEventListener("pageshow", onShow);
        window.addEventListener("focus", onShow);
        document.addEventListener("visibilitychange", onShow);
        return () => {
            disposed = true;
            controller.abort();
            window.removeEventListener("pageshow", onShow);
            window.removeEventListener("focus", onShow);
            document.removeEventListener("visibilitychange", onShow);
        };
    }, []);
    return null;
}
