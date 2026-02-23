export function KeppinLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <line
        x1="12"
        y1="9"
        x2="12"
        y2="39"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M14.5 24 Q24 15 34 10"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14.5 24 Q24 33 34 38"
        stroke="currentColor"
        strokeWidth="3.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="34" cy="10" r="4.8" fill="currentColor" />
      <circle cx="34" cy="38" r="4.8" fill="currentColor" />
    </svg>
  );
}
