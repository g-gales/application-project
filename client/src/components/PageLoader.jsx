const PageLoader = () => {
  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-center h-screen bg-gray-900 text-white p-4">
      {/* Animated Spinner Icon */}
      <svg
        className="animate-spin h-10 w-10 md:h-16 md:w-16 text-blue-500 mb-4 md:mb-0 md:mr-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>

      {/* Responsive Text */}
      <h1 className="animate-pulse text-3xl md:text-5xl lg:text-6xl font-black text-center md:text-left tracking-tighter">
        Loading PowerUp...
      </h1>
    </div>
  );
};

export default PageLoader;
