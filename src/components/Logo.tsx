/** Incinc Media "im" monogram — violet→magenta gradient brand mark. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * (110 / 148)}
      viewBox="0 0 148 110"
      aria-hidden="true"
      className="shrink-0"
    >
      <defs>
        <linearGradient id="im-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#5B21B6" />
          <stop offset="55%" stopColor="#8E24AA" />
          <stop offset="100%" stopColor="#A21CAF" />
        </linearGradient>
        <linearGradient id="im-grad-2" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#A21CAF" />
          <stop offset="100%" stopColor="#4C1D95" />
        </linearGradient>
        <radialGradient id="im-dot" cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#8E24AA" />
          <stop offset="100%" stopColor="#4C1D95" />
        </radialGradient>
      </defs>
      {/* i */}
      <circle cx="15" cy="13" r="13" fill="url(#im-dot)" />
      <path d="M2 44 a13 13 0 0 1 26 0 V110 H2 Z" fill="url(#im-grad)" />
      {/* m — back arch first, front arch overlaps for depth */}
      <path
        d="M88 110 V74 a24 24 0 0 1 48 0 V110"
        fill="none"
        stroke="url(#im-grad-2)"
        strokeWidth="24"
      />
      <path
        d="M42 110 V74 a24 24 0 0 1 48 0 V110"
        fill="none"
        stroke="url(#im-grad)"
        strokeWidth="24"
      />
    </svg>
  );
}

export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark size={compact ? 30 : 36} />
      {!compact && (
        <div className="leading-tight">
          <div className="text-[15px] font-bold tracking-tight text-gray-900">
            ContentFlow Pro
          </div>
          <div className="text-[11px] font-medium text-primary-500">
            Incinc Media
          </div>
        </div>
      )}
    </div>
  );
}
