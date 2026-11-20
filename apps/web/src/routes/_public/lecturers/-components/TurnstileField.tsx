import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

type TurnstileRenderOptions = {
  sitekey: string;
  execution?: "render" | "execute";
  appearance?: "always" | "execute" | "interaction-only";
  "response-field"?: boolean;
  callback?: (token: string) => void;
  "error-callback"?: (code?: string) => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
};

type TurnstileApi = {
  render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string;
  execute: (container: string | HTMLElement) => void;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile requires a browser environment"));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<TurnstileApi>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    const script = existing ?? document.createElement("script");
    script.addEventListener(
      "load",
      () => {
        if (window.turnstile) resolve(window.turnstile);
        else {
          script.remove();
          scriptPromise = null;
          reject(new Error("Turnstile script loaded without exposing an API"));
        }
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => {
        scriptPromise = null;
        script.remove();
        reject(new Error("Failed to load Turnstile"));
      },
      { once: true },
    );
    if (!existing) {
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  });
  return scriptPromise;
}

export type TurnstileFieldHandle = {
  // Runs the invisible challenge and resolves with a fresh token, or null when
  // the challenge cannot be completed (no site key, error, timeout, or unmount).
  execute: () => Promise<string | null>;
};

const CHALLENGE_TIMEOUT_MS = 15_000;

export const TurnstileField = forwardRef<TurnstileFieldHandle, { siteKey: string }>(
  function TurnstileField({ siteKey }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const pendingRef = useRef<{
      resolve: (token: string | null) => void;
      timer: ReturnType<typeof setTimeout>;
    } | null>(null);

    function settle(token: string | null) {
      const pending = pendingRef.current;
      if (!pending) return;
      clearTimeout(pending.timer);
      pendingRef.current = null;
      pending.resolve(token);
    }

    useEffect(() => {
      if (!siteKey) return;
      let cancelled = false;
      void loadTurnstile()
        .then((api) => {
          if (cancelled || !containerRef.current || widgetIdRef.current) return;
          widgetIdRef.current = api.render(containerRef.current, {
            sitekey: siteKey,
            execution: "execute",
            appearance: "interaction-only",
            "response-field": false,
            callback: (token) => settle(token),
            "error-callback": () => settle(null),
            "expired-callback": () => settle(null),
            "timeout-callback": () => settle(null),
          });
        })
        .catch(() => settle(null));
      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Widget already gone; nothing to clean up.
          }
        }
        widgetIdRef.current = null;
        settle(null);
      };
    }, [siteKey]);

    useImperativeHandle(
      ref,
      () => ({
        execute: () =>
          new Promise<string | null>((resolve) => {
            if (!siteKey || !window.turnstile || !widgetIdRef.current) {
              resolve(null);
              return;
            }
            // Drop any earlier pending challenge before starting a new one.
            settle(null);
            const timer = setTimeout(() => settle(null), CHALLENGE_TIMEOUT_MS);
            pendingRef.current = { resolve, timer };
            try {
              window.turnstile.reset(widgetIdRef.current);
              window.turnstile.execute(widgetIdRef.current);
            } catch {
              settle(null);
            }
          }),
      }),
      [siteKey],
    );

    // Invisible widget: the container has no visual footprint.
    return <div ref={containerRef} aria-hidden="true" />;
  },
);
