// Minimal structured JSON logger. One line per event so Vercel/Supabase log
// drains stay greppable. `log.child({ rid })` binds correlation fields (e.g. a
// request id) onto every line. Point a drain at Sentry/Datadog later.
type Fields = Record<string, unknown>;
type Level = "debug" | "info" | "warn" | "error";

function emit(level: Level, msg: string, fields?: Fields) {
  const line = JSON.stringify({ level, msg, t: new Date().toISOString(), ...fields });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

type Logger = {
  debug: (msg: string, fields?: Fields) => void;
  info: (msg: string, fields?: Fields) => void;
  warn: (msg: string, fields?: Fields) => void;
  error: (msg: string, fields?: Fields) => void;
  child: (bound: Fields) => Logger;
};

function makeLogger(bound: Fields): Logger {
  return {
    debug: (msg, fields) => emit("debug", msg, { ...bound, ...fields }),
    info: (msg, fields) => emit("info", msg, { ...bound, ...fields }),
    warn: (msg, fields) => emit("warn", msg, { ...bound, ...fields }),
    error: (msg, fields) => emit("error", msg, { ...bound, ...fields }),
    child: (more) => makeLogger({ ...bound, ...more }),
  };
}

export const log = makeLogger({});

/** Short correlation id for one request/invocation. */
export function newRequestId(): string {
  return crypto.randomUUID().slice(0, 8);
}
