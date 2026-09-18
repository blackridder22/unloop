export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M24 8a16 16 0 1 0 16 16"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
      <path d="M32 3v18l14-9z" fill="currentColor" />
    </svg>
  );
}
