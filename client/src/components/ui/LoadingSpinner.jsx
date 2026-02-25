// theme-aware placeholder loading component

const LoadingSpinner = () => {
  return (
    <div className="flex flex-col justify-center items-center w-full h-screen bg-[var(--bg)] transition-colors duration-300">
      {/* The Spinner Circle */}
      <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin" />

      {/* The Text */}
      <p className="mt-4 text-[var(--muted-text)] font-medium">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
