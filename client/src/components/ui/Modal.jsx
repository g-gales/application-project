import Button from "./Button";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true, // this is the close button at the bottom
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

        {/* // children live here */}
        <div className="h-full w-full">{children}</div>

        {showCloseButton && (
          <div className="mt-4 border-t border-[var(--border)] pt-4">
            <Button
              variant="ghost"
              fullWidth
              onClick={onClose}
              className="text-[10px]"
            >
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
