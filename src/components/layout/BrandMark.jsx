import { useId } from 'react';

export default function BrandMark({ className = '', title = 'BUOD' }) {
  const gradientId = useId().replaceAll(':', '');

  return (
    <svg className={className} viewBox="0 0 100 112" role="img" aria-label={title}>
      <defs>
        <linearGradient id={gradientId} x1="18" y1="16" x2="82" y2="96" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F4D58A" />
          <stop offset="0.52" stopColor="#C99A3D" />
          <stop offset="1" stopColor="#7C5420" />
        </linearGradient>
      </defs>
      <path d="M50 3 95 29v54L50 109 5 83V29z" fill="#090806" stroke={`url(#${gradientId})`} strokeWidth="3" />
      <path d="M24 76V39l26-15 26 15v37" fill="none" stroke={`url(#${gradientId})`} strokeWidth="7" strokeLinejoin="round" />
      <path d="M38 83V49l12-7 12 7v34" fill="none" stroke="#F4D58A" strokeWidth="7" strokeLinejoin="round" />
      <path d="M50 61v32" stroke="#C99A3D" strokeWidth="7" strokeLinecap="square" />
    </svg>
  );
}
