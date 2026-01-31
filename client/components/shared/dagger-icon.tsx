// Custom Dagger icon - sleek blade design
export function DaggerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Blade */}
      <path
        d="M12 2L14.5 8L13 9.5L14 12L12 22L10 12L11 9.5L9.5 8L12 2Z"
        fill="currentColor"
        className="opacity-90"
      />
      {/* Blade highlight */}
      <path
        d="M12 2L13.5 7L12 9L12 2Z"
        fill="white"
        className="opacity-30"
      />
      {/* Guard */}
      <path
        d="M7 10.5L17 10.5L16 11.5L8 11.5L7 10.5Z"
        fill="currentColor"
      />
      {/* Grip accent */}
      <path
        d="M11 13L13 13L12.5 16L11.5 16L11 13Z"
        fill="currentColor"
        className="opacity-70"
      />
    </svg>
  );
}
