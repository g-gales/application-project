export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className={`
          bg-[var(--surface)] p-6 rounded-[var(--radius)] border border-[var(--border)] 
          shadow-2xl animate-in zoom-in duration-200 
          /* Smart Width Logic */
          w-fit min-w-[280px] max-w-[95vw] max-h-[90vh] 
          overflow-y-auto overflow-x-hidden
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-center font-black uppercase text-[10px] tracking-widest text-[var(--muted-text)] mb-4">
            {title}
          </h2>
        )}

        {/* This container ensures the content dictates the width */}
        <div className="h-full w-full">{children}</div>

        {showCloseButton && (
          <button
            onClick={onClose}
            className="w-full mt-6 text-[14px] opacity-50 font-black uppercase tracking-tighter hover:opacity-100 transition-opacity"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
}
