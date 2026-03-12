/**
 * Reusable button
 * @param {Object} props
 * @param {React.ReactNode} props.children - children in the button
 * @param {Function} [props.onClick] - onClick handler functions
 * @param {'primary' | 'secondary' | 'tertiary' | 'ghost' | 'danger'} [props.variant='primary'] - presets based on /styles/global.css
 * @param {string} [props.className] - can pass in additional classNames
 * @param {'button' | 'submit' | 'reset'} [props.type='button'] - HTML type
 * @param {boolean} [props.disabled=false] - boolean disabled
 * @param {boolean} [props.fullWidth=false] - boolean width
 */
const Button = ({
  children,
  onClick,
  variant = "primary", // primary, secondary, ghost, danger
  className = "",
  type = "button",
  disabled = false,
  fullWidth = false,
}) => {
  // matching /styles/global.css
  const baseStyles =
    "px-4 py-3 rounded-[var(--radius)] font-extrabold text-xs uppercase tracking-wider transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2";

  // different variants
  const variants = {
    primary:
      "bg-[var(--primary)] text-[var(--primary-contrast)] hover:opacity-90 shadow-sm",

    secondary:
      "bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:bg-[var(--surface-3)]",

    tertiary:
      "bg-[var(--tertiary)] text-[var(--tertiary-contrast)] hover:opacity-80",

    ghost:
      "bg-transparent text-[var(--muted-text)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]",

    danger:
      "bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
  };

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${widthStyle} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
