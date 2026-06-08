"use client";

/**
 * Catches errors thrown in the root layout itself (where the normal error.tsx
 * can't render). Must include <html> and <body>. Kept dependency-free so it can
 * always render even if the failure is configuration-related.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isEnv = /environment variable/i.test(error.message);
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#f5efe4", color: "#18181b", margin: 0 }}>
        <main style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24, gap: 14 }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>Something went wrong</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#71717a", maxWidth: 360, lineHeight: 1.6 }}>
            {isEnv
              ? "Missing configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your host's environment variables and redeploy."
              : "An unexpected error occurred."}
          </p>
          {error.message && (
            <pre style={{ margin: 0, maxWidth: "100%", overflowX: "auto", fontSize: 12, color: "#71717a", background: "#f4f4f5", padding: "10px 12px", borderRadius: 12 }}>
              {error.message}
            </pre>
          )}
          <button onClick={reset} style={{ border: "none", cursor: "pointer", background: "#18181b", color: "#fff", height: 46, padding: "0 26px", borderRadius: 999, fontSize: 15, fontWeight: 700 }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
