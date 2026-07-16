export default function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <svg
        width="34"
        height="34"
        viewBox="0 0 34 34"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect width="34" height="34" rx="10" fill="#8E4585" />
        <text
          x="17"
          y="22.5"
          textAnchor="middle"
          fontFamily="Inter, sans-serif"
          fontWeight="800"
          fontSize="13"
          fill="white"
        >
          IM
        </text>
      </svg>
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
