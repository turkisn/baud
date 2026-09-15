import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, FolderPlus, GitCompareArrows, Plus, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useWorkspace } from '../../context/WorkspaceContext';

export default function WorkspaceActions({ product, compact = false }) {
  const { t } = useLanguage();
  const { projects, comparison, maxComparison, toggleComparison, createProject, addToProject } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [position, setPosition] = useState({ top: 16, left: 16 });
  const dialogId = useId();
  const dialogTitleId = `${dialogId}-title`;
  const selected = comparison.some((item) => item.id === (product.id || product.product_id));
  const full = !selected && comparison.length >= maxComparison;
  const stop = (event) => { event.preventDefault(); event.stopPropagation(); };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const updatePosition = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      const panel = popoverRef.current?.getBoundingClientRect();
      if (!trigger || !panel) return;
      const top = trigger.bottom + 8 + panel.height <= window.innerHeight - 16
        ? trigger.bottom + 8
        : Math.max(16, trigger.top - panel.height - 8);
      setPosition({ top, left: Math.max(16, Math.min(trigger.right - panel.width, window.innerWidth - panel.width - 16)) });
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsidePointer = (event) => {
      if (!containerRef.current?.contains(event.target) && !popoverRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  function add(projectId, event) {
    stop(event);
    addToProject(projectId, product);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function create(event) {
    stop(event);
    const projectId = createProject(name);
    if (projectId) { addToProject(projectId, product); setName(''); setOpen(false); triggerRef.current?.focus(); }
  }

  return <div ref={containerRef} className={`relative flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`} onClick={(event) => event.stopPropagation()}>
    <button type="button" onClick={(event) => { stop(event); if (!full) toggleComparison(product); }} disabled={full} aria-pressed={selected} title={full ? t('Compare up to three products', 'قارن حتى ثلاثة منتجات') : t('Compare product', 'مقارنة المنتج')} className={`inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-gold/70 bg-gold/20 text-light-gold' : 'border-gold/20 bg-black/80 text-sand hover:border-gold/60'}`}><GitCompareArrows size={15}/>{!compact && (selected ? t('In comparison', 'ضمن المقارنة') : t('Compare', 'مقارنة'))}</button>
    <button ref={triggerRef} type="button" onClick={(event) => { stop(event); setOpen(!open); }} aria-expanded={open} aria-haspopup="dialog" aria-controls={open ? dialogId : undefined} title={t('Save to project', 'حفظ في مشروع')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-gold/20 bg-black/80 px-3 py-2 text-xs font-semibold text-sand transition hover:border-gold/60"><FolderPlus size={15}/>{!compact && t('Save to project', 'حفظ بمشروع')}</button>
    {open && createPortal(<div ref={popoverRef} id={dialogId} role="dialog" aria-modal="false" aria-labelledby={dialogTitleId} style={position} className="fixed z-[60] max-h-[calc(100vh-2rem)] w-72 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl border border-gold/25 bg-[#0d0b08] p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="mb-3 flex items-center justify-between"><strong id={dialogTitleId} className="text-sm text-warm-white">{t('Add to a project', 'إضافة لمشروع')}</strong><button type="button" onClick={() => { setOpen(false); triggerRef.current?.focus(); }} aria-label={t('Close', 'إغلاق')} className="text-sand/60"><X size={16}/></button></div>{projects.length > 0 && <div className="mb-3 max-h-40 space-y-1 overflow-auto">{projects.map((project) => { const saved = project.products.some((item) => item.id === (product.id || product.product_id)); return <button key={project.id} type="button" onClick={(event) => add(project.id, event)} className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-start text-xs text-sand hover:bg-gold/10">{project.name}{saved && <Check size={14} className="text-gold"/>}</button>; })}</div>}<form onSubmit={create} className="flex gap-2"><label className="min-w-0 flex-1"><span className="sr-only">{t('New project name', 'اسم مشروع جديد')}</span><input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={100} placeholder={t('New project name', 'اسم مشروع جديد')} className="w-full rounded-lg border border-gold/20 bg-black px-2 py-2 text-xs text-warm-white"/></label><button type="submit" aria-label={t('Create project', 'إنشاء مشروع')} className="rounded-lg bg-gold px-2 text-black"><Plus size={16}/></button></form></div>, document.body)}
  </div>;
}
