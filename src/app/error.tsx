"use client";

import { useEffect } from "react";

/**
 * Route error boundary — turns an unhandled error into a visible, friendly
 * screen instead of a blank white page. The most common cause in production is
 * a missing `NEXT_PUBLIC_SUPABASE_*` environment variable (the message below
 * will say so), which surfaces the first time a Supabase client is created
 * (e.g. submitting login/signup). Set the env vars on your host and redeploy.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface in the console/logs for debugging.
    console.error(error);
  }, [error]);

  const isEnv = /environment variable/i.test(error.message);

  return (
    <main className="theme-cream sf">
      <div
        className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center text-center"
        style={{ padding: "24px 24px", gap: 14 }}
      >
        <div style={{ fontSize: 40 }}>⚠️</div>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
          Something went wrong
        </h1>
        <p className="muted" style={{ margin: 0, fontSize: 14, lineHeight: 1.6, maxWidth: 340 }}>
          {isEnv
            ? "The app is missing its configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your host's environment variables (all environments) and redeploy."
            : "An unexpected error occurred. Try again, and if it persists check the deployment logs."}
        </p>
        {error.message && (
          <pre
            dir="ltr"
            style={{ margin: 0, maxWidth: "100%", overflowX: "auto", fontSize: 12, color: "var(--z500)", background: "var(--z100)", padding: "10px 12px", borderRadius: 12, textAlign: "start" }}
          >
            {error.message}
            {error.digest ? `\n(digest: ${error.digest})` : ""}
          </pre>
        )}
        <button onClick={reset} className="btn btn-primary btn-pill" style={{ width: "auto", paddingInline: 28, marginTop: 4 }}>
          Try again
        </button>
      </div>
    </main>
  );
}
