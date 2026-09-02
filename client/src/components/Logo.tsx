export function Marchio({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      role="img"
      aria-label="Financy"
    >
      <path d="M3.2 6.6c4.4 0 4.7 5.4 8.6 5.4" />
      <path d="M3.2 17.4c4.4 0 4.7-5.4 8.6-5.4" />
      <path d="M11.8 12h1.6" className="text-primary" stroke="currentColor" />
      <path d="M13.6 11.8 19 6.6" className="text-primary" stroke="currentColor" />
      <circle cx="20" cy="5.6" r="1.7" fill="currentColor" stroke="none" className="text-primary" />
    </svg>
  );
}

export function Logotipo({ compatto = false, nome = 'Financy' }: { compatto?: boolean; nome?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Marchio className="h-7 w-7 shrink-0 text-foreground" />
      {!compatto && (
        <span className="text-[1.0625rem] font-semibold tracking-tight leading-none">
          {nome}
        </span>
      )}
    </div>
  );
}
