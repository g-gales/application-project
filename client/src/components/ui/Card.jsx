export default function Card({ title, children, footer }) {
  return (
    <section className="rounded-[14px] bg-[var(--surface)] border border-[var(--border)] shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden">
      {title ? (
        <header className="px-4 pt-4">
          <h2 className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--muted-text-2)]">
            {title}
          </h2>
        </header>
      ) : null}

      <div className="px-4 pb-4 pt-3">{children}</div>

      {footer ? (
        <footer className="px-4 pb-4 pt-3 border-t border-[var(--border)]">
          {footer}
        </footer>
      ) : null}
    </section>
  );
}
