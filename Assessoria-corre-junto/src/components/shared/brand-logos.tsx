export function StravaLogo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.637h4.122L10.379 0 3 14.702h4.122" />
    </svg>
  );
}

export function CorosLogo({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 4.4L18.6 8.2V15.8L12 19.6L5.4 15.8V8.2L12 4.4ZM12 0L2 5.8V18.2L12 24L22 18.2V5.8L12 0Z" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
