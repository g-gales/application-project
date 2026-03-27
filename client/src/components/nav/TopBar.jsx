import ThemeToggle from "../theme/ThemeToggle";
import MiniTimer from "../ui/MiniTimer";
import { useLocation } from "react-router-dom";

function titleFromPath(pathname) {
  const segments = pathname.split("/").filter(Boolean);

  // Example: /app/courses/12345 -> ["app","courses","12345"]
  const last = segments.at(-1) || "dashboard";

  const looksLikeId =
    /^\d+$/.test(last) || // purely numeric
    /^[a-f0-9]{24}$/i.test(last) || // Mongo ObjectId
    /^[a-f0-9-]{16,}$/i.test(last); // UUID-ish / long ids

  if (looksLikeId) {
    // Return the parent segment instead (courses)
    const parent = segments.at(-2) || last;
    return humanize(parent);
  }

  return humanize(last);
}

function humanize(seg) {
  return seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Topbar({ drawerId, mobileOpen, onToggleMobile }) {
  const { pathname } = useLocation();
  const title = titleFromPath(pathname);

  return (
    <header
      className={[
        "sticky top-0 z-10",
        "flex items-center justify-between gap-3",
        "px-4 py-3 md:px-5",
        "border-b border-[var(--border)]",
        "bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] backdrop-blur",
      ].join(" ")}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-xl px-3 py-2 border border-[var(--border)] hover:bg-[var(--surface-2)]"
          onClick={onToggleMobile}
          aria-label={
            mobileOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-controls={drawerId}
          aria-expanded={mobileOpen}
        >
          ☰
        </button>

        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-[var(--muted-text)]">
            Student Powerup
          </div>
          <h1 className="m-0 text-lg font-extrabold truncate">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <MiniTimer />
        <ThemeToggle />
      </div>
    </header>
  );
}
