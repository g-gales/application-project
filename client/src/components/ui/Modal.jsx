export default function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose} // closes when backdrop is clicked
    >
      <div
        className="bg-[var(--surface)] p-6 rounded-[var(--radius)] border border-[var(--border)] w-full max-w-[320px] shadow-2xl animate-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h2 className="text-center font-black uppercase text-[10px] tracking-widest text-[var(--muted-text)] mb-4">
            {title}
          </h2>
        )}

        {children}

        <button
          onClick={onClose}
          className="w-full mt-4 text-[10px] opacity-50 font-black uppercase tracking-tighter hover:opacity-100 transition-opacity"
        >
          Close
        </button>
      </div>
    </div>
  );
}
