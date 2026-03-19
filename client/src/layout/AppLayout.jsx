import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useId, useState } from "react";
import Sidebar from "../components/nav/Sidebar";
import Topbar from "../components/nav/TopBar";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerId = useId();
  const location = useLocation();

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Escape closes drawer
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    if (mobileOpen) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  return (
    <div className="h-screen min-w-screen max-w-[1495px] bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto w-full max-w-[1495px] min-h-screen md:grid md:grid-cols-[280px_1fr]">
        {/* Sidebar (desktop) */}
        <aside className="hidden min-h-screen h-full md:block md:sticky md:top-0 md:self-start md:h-screen bg-[var(--surface)] border-r border-[var(--border)] overflow-hidden">
          <Sidebar />
        </aside>

        {/* Mobile drawer + backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/45 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside
          id={drawerId}
          className={[
            "fixed top-0 left-0 z-30 h-screen w-[min(84vw,320px)] md:hidden",
            "bg-[var(--surface)] border-r border-[var(--border)]",
            "transform transition-transform duration-200 ease-out",
            mobileOpen ? "translate-x-0" : "-translate-x-[105%]",
          ].join(" ")}
          aria-hidden={!mobileOpen}
        >
          <Sidebar />
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex flex-col min-h-screen">
          <Topbar
            drawerId={drawerId}
            mobileOpen={mobileOpen}
            onToggleMobile={() => setMobileOpen((v) => !v)}
          />

          <main className="flex-1 w-full h-screen p-4 md:p-5 overflow-y-auto">
            <div className="mx-auto w-full min-h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
