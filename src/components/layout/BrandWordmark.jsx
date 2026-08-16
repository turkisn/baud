export default function BrandWordmark({ inverse = false, compact = false }) {
  const ink = inverse ? '#F8F5EF' : '#2E1F13';
  return (
    <span className="inline-flex items-center gap-3" aria-label="BUOD">
      <span className={`relative grid ${compact ? 'h-8 w-8' : 'h-10 w-10'} place-items-center overflow-hidden rounded-lg border border-gold/60 bg-gold/10`}>
        <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true">
          <path d="M16 4 26 10v12l-10 6-10-6V10l10-6Z" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
          <path d="m6 10 10 6 10-6M16 16v12" fill="none" stroke="#C9A84C" strokeWidth="1.5" />
        </svg>
        <span className="absolute bottom-1 right-1 h-1.5 w-1.5 bg-gold" />
      </span>
      <span className="leading-none">
        <span className={`${compact ? 'text-lg' : 'text-xl'} block font-black tracking-[0.18em]`} style={{ color: ink }}>BUOD</span>
        {!compact && <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">Product data library</span>}
      </span>
    </span>
  );
}
