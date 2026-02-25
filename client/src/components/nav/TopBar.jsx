import ThemeToggle from "../theme/ThemeToggle";
import { useLocation } from "react-router-dom";

function titleFromPath(pathname) {
  const last = pathname.split("/").filter(Boolean).slice(-1)[0] || "dashboard";
  return last.charAt(0).toUpperCase() + last.slice(1);
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
      ].join(" ")}>
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-xl px-3 py-2 border border-[var(--border)] hover:bg-[var(--surface-2)]"
          onClick={onToggleMobile}
          aria-label={
            mobileOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-controls={drawerId}
          aria-expanded={mobileOpen}>
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
        <ThemeToggle />
      </div>
    </header>
  );
}
