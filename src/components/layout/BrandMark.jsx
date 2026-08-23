import { useId } from 'react';

export default function BrandMark({ className = '', title = 'BUOD' }) {
  const id = useId().replaceAll(':', '');
  const frame = `${id}-frame`;
  const top = `${id}-top`;
  const left = `${id}-left`;
  const right = `${id}-right`;
  const topClip = `${id}-top-clip`;
  const leftClip = `${id}-left-clip`;
  const rightClip = `${id}-right-clip`;

  return (
    <svg className={`buod-brand-mark ${className}`} viewBox="0 0 120 120" role="img" aria-label={title}>
      <defs>
        <linearGradient id={frame} x1="14" y1="15" x2="103" y2="102" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F1D493"/>
          <stop offset="0.3" stopColor="#D8AF69"/>
          <stop offset="0.7" stopColor="#A47735"/>
          <stop offset="1" stopColor="#E6C67F"/>
        </linearGradient>
        <linearGradient id={top} x1="34" y1="34" x2="80" y2="66" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F0D39B"/>
          <stop offset="1" stopColor="#B38746"/>
        </linearGradient>
        <linearGradient id={left} x1="35" y1="52" x2="60" y2="91" gradientUnits="userSpaceOnUse">
          <stop stopColor="#77562F"/>
          <stop offset="1" stopColor="#3E2B18"/>
        </linearGradient>
        <linearGradient id={right} x1="79" y1="50" x2="55" y2="91" gradientUnits="userSpaceOnUse">
          <stop stopColor="#201A11"/>
          <stop offset="1" stopColor="#0A0907"/>
        </linearGradient>
        <clipPath id={topClip}><path d="M57 36 80 49.5 57 63 34 49.5z"/></clipPath>
        <clipPath id={leftClip}><path d="M34 49.5 57 63v27L34 76.5z"/></clipPath>
        <clipPath id={rightClip}><path d="M80 49.5 57 63v27l23-13.5z"/></clipPath>
      </defs>

      <g className="buod-mark-network" fill="none" stroke="#D5A758" strokeLinecap="round" strokeLinejoin="round">
        <path className="buod-mark-trace" d="M41 42 36 34H25M51 38v-9l-8-5M62 38l8-9h13M76 48h11l7-8"/>
        <path className="buod-mark-trace buod-mark-trace-delayed" d="M34 57H23l-6-5M35 70H24l-7 7M48 84v9l-9 7M66 85l7 8h11M78 72h14"/>
        <path className="buod-mark-trace buod-mark-trace-output" d="M78 54h12l8-4M78 62h12l8-1M78 71h12l8 2"/>
      </g>

      <path d="M96 37v-5L57 10 15 34v50l42 25 39-22v-6" fill="none" stroke="#59401E" strokeLinejoin="miter" strokeWidth="10" transform="translate(1.5 2)"/>
      <path d="M96 37v-5L57 10 15 34v50l42 25 39-22v-6" fill="none" stroke={`url(#${frame})`} strokeLinejoin="miter" strokeWidth="7"/>
      <path d="M94 34 57 13 18 35v47l39 23 37-21" fill="none" stroke="#F4DFAD" strokeOpacity="0.42" strokeWidth="0.8"/>

      <path d="M57 36 80 49.5 57 63 34 49.5z" fill={`url(#${top})`} stroke="#F1D69C" strokeWidth="1.15"/>
      <path d="M34 49.5 57 63v27L34 76.5z" fill={`url(#${left})`} stroke="#D0A460" strokeWidth="1.1"/>
      <path d="M80 49.5 57 63v27l23-13.5z" fill={`url(#${right})`} stroke="#DCB677" strokeWidth="1.1"/>

      <g className="buod-mark-circuitry" fill="none" stroke="#F0CF87" strokeLinecap="round" strokeWidth="0.68">
        <g clipPath={`url(#${topClip})`}><path d="M41 39v9l6 4M48 35v10l7 5M61 38v7l-6 5v7M71 41v8l-8 5"/></g>
        <g clipPath={`url(#${leftClip})`}><path d="M39 51v12l5 3v11M46 56v9l4 3v13M37 64l5 3v6"/></g>
        <g clipPath={`url(#${rightClip})`}><path d="M61 65h7l4-3h12M61 72h8l4-3h11M61 80h7l4-4h12"/></g>
      </g>

      <g className="buod-mark-junctions" fill="#F6D997">
        <circle cx="25" cy="34" r="1"/><circle cx="43" cy="24" r="0.9"/>
        <circle cx="83" cy="29" r="0.9"/><circle cx="17" cy="52" r="0.9"/>
        <circle cx="17" cy="77" r="0.9"/><circle cx="39" cy="100" r="0.9"/>
        <circle cx="84" cy="93" r="0.95"/><circle cx="55" cy="50" r="0.9"/>
        <circle cx="44" cy="77" r="0.85"/><circle cx="68" cy="65" r="0.9"/>
      </g>

      <g className="buod-mark-nodes">
        <path d="M99 44h9v9h-9z" fill={`url(#${frame})`} stroke="#F1D599" strokeWidth="0.65"/>
        <path d="M99 57h9v9h-9z" fill={`url(#${frame})`} stroke="#F1D599" strokeWidth="0.65"/>
        <path d="M99 70h9v9h-9z" fill={`url(#${frame})`} stroke="#F1D599" strokeWidth="0.65"/>
        <path d="m99 44 9 9m-9 4 9 9m-9 4 9 9" fill="none" stroke="#FFF0C0" strokeOpacity="0.28" strokeWidth="0.6"/>
      </g>
    </svg>
  );
}
