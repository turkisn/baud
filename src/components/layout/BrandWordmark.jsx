import BrandMark from './BrandMark';

export default function BrandWordmark({ inverse = false, compact = false }) {
  const ink = inverse ? '#F8F5EF' : '#2E1F13';
  return (
    <span className="inline-flex items-center gap-2.5" aria-label="BUOD">
      <BrandMark className={compact ? 'h-8 w-8' : 'h-10 w-10'} />
      <span className="leading-none">
        <span className={`${compact ? 'text-xl' : 'text-2xl'} block font-black tracking-[0.2em]`} style={{ color: ink }}>BUOD</span>
        {!compact && <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.2em] text-gold">Product data library</span>}
      </span>
    </span>
  );
}
