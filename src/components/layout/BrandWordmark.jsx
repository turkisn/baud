import BrandMark from './BrandMark';
import { useLanguage } from '../../context/LanguageContext';

export default function BrandWordmark({ inverse = false, compact = false }) {
  const { t } = useLanguage();
  return (
    <span className={`buod-wordmark ${inverse ? 'buod-wordmark-inverse' : ''} ${compact ? 'buod-wordmark-compact' : ''}`} aria-label="BUOD">
      <span className="buod-wordmark-symbol"><BrandMark className={compact ? 'h-10 w-9' : 'h-12 w-11'} /></span>
      <span className="buod-wordmark-copy">
        <span className="buod-wordmark-name">BUOD<span className="buod-wordmark-point" aria-hidden="true"/></span>
        <span className="buod-wordmark-baseline" aria-hidden="true"><span/>{t('PRODUCT DATA NETWORK', 'هوية المنتجات الرقمية')}</span>
      </span>
    </span>
  );
}
