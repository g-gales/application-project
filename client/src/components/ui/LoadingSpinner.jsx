// theme-aware placeholder loading component
const LoadingSpinner = ({ size = "fullscreen" }) => {
  // just icon
  if (size === "tiny") {
    return (
      <div
        className="inline-block w-4 h-4 rounded-full border-2 border-[var(--border)] border-t-[var(--primary)] animate-spin"
        aria-hidden="true"
      />
    );
  }

  // not fullscreen
  if (size === "small") {
    return (
      <div className="flex flex-col justify-center items-center w-full h-full min-h-[150px] p-4">
        <div className="w-8 h-8 rounded-full border-3 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
        <p className="mt-2 text-sm text-[var(--muted-text)] font-medium">
          Loading...
        </p>
      </div>
    );
  }

  //fullscreen
  return (
    <div className="flex flex-col justify-center items-center w-full h-screen bg-[var(--bg)] transition-colors duration-300">
      <div className="w-12 h-12 rounded-full border-4 border-[var(--border)] border-t-[var(--primary)] animate-spin" />
      <p className="mt-4 text-[var(--muted-text)] font-medium">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;
