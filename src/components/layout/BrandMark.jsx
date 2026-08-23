import { useId } from 'react';

export default function BrandMark({ className = '', title = 'BUOD' }) {
  const markId = useId().replaceAll(':', '');
  const goldId = `${markId}-gold`;
  const edgeId = `${markId}-edge`;
  const ambientId = `${markId}-ambient`;

  return (
    <svg className={`buod-brand-mark ${className}`} viewBox="0 0 100 112" role="img" aria-label={title}>
      <defs>
        <linearGradient id={goldId} x1="16" y1="18" x2="79" y2="99" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF0B8" />
          <stop offset="0.33" stopColor="#E8C473" />
          <stop offset="0.68" stopColor="#BE8B36" />
          <stop offset="1" stopColor="#F1D28F" />
        </linearGradient>
        <linearGradient id={edgeId} x1="8" y1="7" x2="93" y2="101" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D8B16A" stopOpacity="0.84" />
          <stop offset="0.48" stopColor="#F8DF9C" />
          <stop offset="1" stopColor="#775222" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id={ambientId} cx="50%" cy="57%" r="66%">
          <stop stopColor="#23190C" />
          <stop offset="0.7" stopColor="#100D08" />
          <stop offset="1" stopColor="#060504" />
        </radialGradient>
      </defs>
      <path d="M50 3.5 95 29v54L50 108.5 5 83V29z" fill={`url(#${ambientId})`} stroke={`url(#${edgeId})`} strokeWidth="2.15" />
      <path d="M50 9.5 89.5 32v48L50 102.5 10.5 80V32z" fill="none" stroke="#C69A50" strokeOpacity="0.28" strokeWidth="0.9" />

      <g fill="none" stroke="#D9AF62" strokeLinecap="round" strokeOpacity="0.52" strokeWidth="1">
        <path d="M14 42h10l5 5" />
        <path d="M86 42H76l-5 5" />
        <path d="M14 70h8l5-5" />
        <path d="M86 70h-8l-5-5" />
        <path d="M42 17v7" />
        <path d="M58 17v7" />
      </g>
      <g className="buod-mark-nodes" fill="#F5D792">
        <circle cx="14" cy="42" r="1.55" />
        <circle cx="86" cy="42" r="1.55" />
        <circle cx="14" cy="70" r="1.35" />
        <circle cx="86" cy="70" r="1.35" />
        <circle cx="42" cy="17" r="1.25" />
        <circle cx="58" cy="17" r="1.25" />
      </g>

      <path d="M25 77V40l25-14.5L75 40v37" fill="none" stroke={`url(#${goldId})`} strokeLinecap="square" strokeLinejoin="miter" strokeWidth="6.5" />
      <path d="M38 83V49.5L50 42l12 7.5V83" fill="none" stroke="#F3D494" strokeLinecap="square" strokeLinejoin="miter" strokeWidth="6" />
      <path d="M50 61v32" stroke={`url(#${goldId})`} strokeLinecap="square" strokeWidth="6" />
      <path d="M47.5 98h5" stroke="#F5DFAB" strokeLinecap="round" strokeOpacity="0.9" strokeWidth="1" />
    </svg>
  );
}
