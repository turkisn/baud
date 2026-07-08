import { useState, useMemo } from 'react';
import { Search, Filter, Grid, List, SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { blocks, categories } from '../data/mockData';
import BlockCard from '../components/BlockCard';

const formats = ['DWG', 'RVT', 'SKP', 'OBJ', 'FBX', '3DS', 'MAX', 'STL', 'IES'];

export default function Library() {
  const { t, lang } = useLanguage();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [sortBy, setSortBy] = useState('featured');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMax, setPriceMax] = useState(10000);
  const [onlyNew, setOnlyNew] = useState(false);

  const filteredBlocks = useMemo(() => {
    let result = [...blocks];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.name.toLowerCase().includes(q) ||
        b.nameAr.includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.tags.some(tag => tag.includes(q))
      );
    }

    if (selectedCategory !== 'all') {
      result = result.filter(b =>
        b.category.toLowerCase().replace(/\s+/g, '') === selectedCategory ||
        b.category === categories.find(c => c.id === selectedCategory)?.name
      );
    }

    if (selectedFormats.length > 0) {
      result = result.filter(b => selectedFormats.every(f => b.formats.includes(f)));
    }

    result = result.filter(b => b.price <= priceMax);

    if (onlyNew) result = result.filter(b => b.new);

    if (sortBy === 'price-asc') result.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price-desc') result.sort((a, b) => b.price - a.price);
    else if (sortBy === 'rating') result.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'downloads') result.sort((a, b) => b.downloads - a.downloads);
    else result.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.featured ? 1 : 0));

    return result;
  }, [search, selectedCategory, selectedFormats, sortBy, priceMax, onlyNew]);

  const toggleFormat = (fmt) => {
    setSelectedFormats(prev =>
      prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSelectedFormats([]);
    setSortBy('featured');
    setPriceMax(10000);
    setOnlyNew(false);
  };

  const activeFilterCount = [
    selectedCategory !== 'all',
    selectedFormats.length > 0,
    priceMax < 10000,
    onlyNew,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-ivory">
      {/* Header */}
      <div className="bg-dark-brown py-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <svg viewBox="0 0 600 200" className="w-full h-full">
            {[...Array(8)].map((_, i) => (
              <polygon key={i} points={`${i * 80},0 ${i * 80 + 40},100 ${i * 80},200 ${i * 80 - 40},100`}
                stroke="#C9A84C" strokeWidth="0.5" fill="none"
              />
            ))}
          </svg>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-warm-white mb-2">
            {t('3D Block Library', 'مكتبة الكتل ثلاثية الأبعاد')}
          </h1>
          <p className="text-light-brown">
            {t('Saudi market products as downloadable 3D blocks', 'منتجات السوق السعودية ككتل ثلاثية الأبعاد قابلة للتحميل')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search + Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-light-brown" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('Search blocks, materials, suppliers...', 'ابحث عن كتل، مواد، موردين...')}
              className="input-field pl-10"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-light-brown hover:text-dark-brown">
                <X size={16} />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-lg border font-medium text-sm transition-all ${
              showFilters || activeFilterCount > 0
                ? 'bg-dark-brown text-white border-dark-brown'
                : 'bg-white border-sand text-medium-brown hover:border-dark-brown'
            }`}
          >
            <SlidersHorizontal size={16} />
            {t('Filters', 'الفلاتر')}
            {activeFilterCount > 0 && (
              <span className="bg-white text-gold rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="input-field w-auto px-4 py-3 cursor-pointer"
          >
            <option value="featured">{t('Featured', 'المميز')}</option>
            <option value="rating">{t('Top Rated', 'الأعلى تقييماً')}</option>
            <option value="downloads">{t('Most Downloaded', 'الأكثر تحميلاً')}</option>
            <option value="price-asc">{t('Price: Low to High', 'السعر: الأقل فالأعلى')}</option>
            <option value="price-desc">{t('Price: High to Low', 'السعر: الأعلى فالأقل')}</option>
          </select>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-dark-brown text-white'
                  : 'bg-white text-medium-brown border border-sand hover:border-dark-brown hover:text-gold'
              }`}
            >
              {lang === 'ar' ? cat.nameAr : cat.name}
            </button>
          ))}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-white border border-sand rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-dark-brown">{t('Advanced Filters', 'فلاتر متقدمة')}</h3>
              <button onClick={clearFilters} className="text-sm text-gold hover:underline">
                {t('Clear All', 'مسح الكل')}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-dark-brown mb-2">
                  {t('File Format', 'صيغة الملف')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {formats.map(fmt => (
                    <button
                      key={fmt}
                      onClick={() => toggleFormat(fmt)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all ${
                        selectedFormats.includes(fmt)
                          ? 'bg-dark-brown text-white border-dark-brown'
                          : 'bg-sand text-medium-brown border-sand hover:border-dark-brown'
                      }`}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-brown mb-2">
                  {t('Max Price', 'السعر الأقصى')}: {priceMax.toLocaleString()} SAR
                </label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={priceMax}
                  onChange={e => setPriceMax(Number(e.target.value))}
                  className="w-full accent-saudi-green"
                />
                <div className="flex justify-between text-xs text-light-brown mt-1">
                  <span>100 SAR</span>
                  <span>10,000 SAR</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-dark-brown mb-3">
                  {t('Other', 'أخرى')}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyNew}
                    onChange={e => setOnlyNew(e.target.checked)}
                    className="w-4 h-4 accent-saudi-green rounded"
                  />
                  <span className="text-sm text-medium-brown">{t('New arrivals only', 'الوافدون الجدد فقط')}</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-light-brown">
            {filteredBlocks.length} {t('results', 'نتيجة')}
          </p>
        </div>

        {filteredBlocks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-dark-brown mb-2">{t('No blocks found', 'لم يتم العثور على كتل')}</h3>
            <p className="text-light-brown mb-4">{t('Try different search terms or filters', 'جرب مصطلحات بحث أو فلاتر مختلفة')}</p>
            <button onClick={clearFilters} className="btn-secondary">
              {t('Clear Filters', 'مسح الفلاتر')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBlocks.map(block => (
              <BlockCard key={block.id} block={block} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
