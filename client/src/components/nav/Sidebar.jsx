import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const links = [
  { to: "/app/dashboard", label: "Dashboard" },
  { to: "/app/calendar", label: "Calendar" },
  { to: "/app/courses", label: "Courses" },
  { to: "/app/wellness", label: "Wellness" },
  { to: "/app/pomodoro", label: "Pomodoro" },
  { to: "/app/flashcards", label: "Flashcards" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  return (
    <div className="h-full p-4 md:p-5 grid gap-4">
      <div className="flex items-center gap-3 p-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)]">
        <div className="w-10 h-10 grid place-items-center rounded-xl bg-[var(--primary)] text-[var(--primary-contrast)] font-extrabold">
          &lt;/&gt;
        </div>{" "}
        {/* Placeholder logo/mark */}
        <div>
          <div className="font-extrabold">Student Powerup</div>
          <div className="text-xs text-[var(--muted-text)]">
            Welcome back, {user?.firstName || "Student"}!
          </div>
        </div>
      </div>

      <nav className="grid gap-2" aria-label="Primary">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              [
                "block rounded-xl px-3 py-2 border",
                "transition-colors",
                isActive
                  ? "border-[var(--border)] bg-[var(--surface-2)] font-bold"
                  : "border-transparent hover:bg-[var(--surface-2)]",
              ].join(" ")
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-3 border-t border-[var(--border)]">
        <button
          onClick={logout}
          className=" mt-2 mb-2 w-full text-left block rounded-xl px-3 py-2 border border-transparent text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors font-medium cursor-pointer"
        >
          Logout
        </button>
        <div className="text-xs text-[var(--muted-text)]">
          v0.1 • Sprint 1 shell
        </div>
      </div>
    </div>
  );
}
