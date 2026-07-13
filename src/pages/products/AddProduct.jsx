import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight, ChevronLeft, Save, Send, Eye, Check, Plus, Trash2,
  Upload, FileText, Image as ImgIcon, AlertCircle, Copy, Info,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import {
  CATEGORIES, SUBCATEGORIES, CATEGORY_SPECS, UNITS,
  FILE_FORMATS, SOFTWARE_LIST, LICENSE_TYPES, MATERIAL_TYPES,
} from '../../data/categoriesData';
import { productService } from '../../services/productService';

// ─── Brand tokens ────────────────────────────────────────────
const GOLD  = '#B68D57';
const DARK  = '#2B1B0E';
const IVORY = '#F7F4EF';
const SAND  = '#D6C2A1';
const BEIGE = '#EBDFD1';

// ─── STEPS config ────────────────────────────────────────────
const STEPS = [
  { id: 1, labelEn: 'Basic Info',     labelAr: 'المعلومات الأساسية', icon: '📋' },
  { id: 2, labelEn: 'Specifications', labelAr: 'المواصفات',           icon: '📐' },
  { id: 3, labelEn: 'Materials',      labelAr: 'المواد والخامات',      icon: '🧱' },
  { id: 4, labelEn: 'Components',     labelAr: 'المكونات',             icon: '🔩' },
  { id: 5, labelEn: 'Files',          labelAr: 'الملفات',              icon: '📁' },
  { id: 6, labelEn: 'Images',         labelAr: 'الصور',                icon: '🖼️' },
  { id: 7, labelEn: 'Pricing',        labelAr: 'السعر والتوفر',        icon: '💰' },
  { id: 8, labelEn: 'License',        labelAr: 'الحقوق والترخيص',     icon: '📜' },
  { id: 9, labelEn: 'Review',         labelAr: 'المراجعة والإرسال',    icon: '✅' },
];

const EMPTY_MATERIAL  = { material_name_en: '', material_name_ar: '', material_type: '', finish: '', color: '', quantity_per_product: '', unit: 'M2', waste_percentage: '5', unit_cost: '' };
const EMPTY_COMPONENT = { component_name_en: '', component_name_ar: '', quantity: '1', unit: 'PC', notes: '' };
const EMPTY_SPEC      = { specification_name_en: '', value: '', unit: '' };
const EMPTY_FILE      = { software_name: 'Autodesk Revit', software_version: '2024', file_format: 'RFA', file_name_original: '', file_size: '', is_primary: false };

const INITIAL_FORM = {
  product_name_ar: '', product_name_en: '',
  short_description_ar: '', short_description_en: '',
  full_description_ar: '',  full_description_en: '',
  category_id: '', subcategory_id: '',
  product_type: '', brand_name: '', model_number: '',
  manufacturer_product_code: '', country_of_origin: '', unit: 'PC',
  specifications: [],
  materials: [{ ...EMPTY_MATERIAL }],
  components: [],
  files: [{ ...EMPTY_FILE }],
  images: [],
  is_free: true, price: '', currency: 'SAR',
  lead_time: '', min_order_qty: '1', in_stock: true, regions: [],
  license_type: 'CC BY 4.0',
  license_commercial: false, license_download: true,
  license_modify: false, license_redistribute: false,
  source_url: '', rights_confirmed: false, agreed_to_terms: false,
};

// ─── Sub-components ──────────────────────────────────────────

function FieldLabel({ children, required }) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#6E5847' }}>
      {children} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = 'text', className = '', ...rest }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${className}`}
      style={{ background: IVORY, borderColor: SAND, fontFamily: 'Cairo, sans-serif',
        '--tw-ring-color': GOLD + '40' }}
      {...rest}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value} onChange={onChange} placeholder={placeholder} rows={rows}
      className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all resize-none focus:ring-2"
      style={{ background: IVORY, borderColor: SAND, fontFamily: 'Cairo, sans-serif',
        '--tw-ring-color': GOLD + '40' }}
    />
  );
}

function Select({ value, onChange, children, className = '' }) {
  return (
    <select
      value={value} onChange={onChange}
      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none appearance-none cursor-pointer ${className}`}
      style={{ background: IVORY, borderColor: SAND, fontFamily: 'Cairo, sans-serif' }}
    >
      {children}
    </select>
  );
}

function Card({ children, className = '' }) {
  return (
    <div className={`rounded-2xl border p-5 ${className}`}
      style={{ background: 'white', borderColor: SAND }}>
      {children}
    </div>
  );
}

function IconBtn({ onClick, icon, danger }) {
  return (
    <button type="button" onClick={onClick}
      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80 flex-shrink-0"
      style={{ background: danger ? '#fee2e2' : BEIGE, color: danger ? '#ef4444' : DARK }}>
      {icon}
    </button>
  );
}

function AddBtn({ onClick, labelEn, labelAr, lang }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all hover:opacity-80 mt-3"
      style={{ borderColor: GOLD, color: GOLD, background: GOLD + '10' }}>
      <Plus size={14} />
      {lang === 'ar' ? labelAr : labelEn}
    </button>
  );
}

// ─── STEP 1: Basic Info ──────────────────────────────────────
function Step1({ form, update, lang }) {
  const subs = SUBCATEGORIES[form.category_id] || [];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>اسم المنتج (عربي)</FieldLabel>
          <Input value={form.product_name_ar} onChange={e => update('product_name_ar', e.target.value)} placeholder="مثال: كنبة ثلاثية فاخرة" />
        </div>
        <div>
          <FieldLabel required>Product Name (English)</FieldLabel>
          <Input value={form.product_name_en} onChange={e => update('product_name_en', e.target.value)} placeholder="e.g. Three-Seat Luxury Sofa" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>{lang === 'ar' ? 'التصنيف' : 'Category'}</FieldLabel>
          <Select value={form.category_id} onChange={e => update('category_id', e.target.value)}>
            <option value="">{lang === 'ar' ? '— اختر التصنيف —' : '— Select Category —'}</option>
            {CATEGORIES.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {lang === 'ar' ? c.nameAr : c.nameEn}</option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel required>{lang === 'ar' ? 'التصنيف الفرعي' : 'Sub-category'}</FieldLabel>
          <Select value={form.subcategory_id} onChange={e => update('subcategory_id', e.target.value)} disabled={!form.category_id}>
            <option value="">{lang === 'ar' ? '— اختر التصنيف الفرعي —' : '— Select Sub-category —'}</option>
            {subs.map(s => (
              <option key={s.id} value={s.id}>{lang === 'ar' ? s.nameAr : s.nameEn}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <FieldLabel>{lang === 'ar' ? 'نوع المنتج' : 'Product Type'}</FieldLabel>
          <Input value={form.product_type} onChange={e => update('product_type', e.target.value)} placeholder="e.g. Seating, Table, Pendant…" />
        </div>
        <div>
          <FieldLabel required>{lang === 'ar' ? 'الوحدة الأساسية' : 'Unit'}</FieldLabel>
          <Select value={form.unit} onChange={e => update('unit', e.target.value)}>
            {UNITS.map(u => <option key={u.id} value={u.id}>{lang === 'ar' ? u.labelAr : u.labelEn}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>{lang === 'ar' ? 'بلد المنشأ' : 'Country of Origin'}</FieldLabel>
          <Input value={form.country_of_origin} onChange={e => update('country_of_origin', e.target.value)} placeholder="Saudi Arabia, UAE…" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <FieldLabel>{lang === 'ar' ? 'العلامة التجارية' : 'Brand Name'}</FieldLabel>
          <Input value={form.brand_name} onChange={e => update('brand_name', e.target.value)} placeholder="e.g. Al-Raaha" />
        </div>
        <div>
          <FieldLabel>{lang === 'ar' ? 'رقم الموديل' : 'Model Number'}</FieldLabel>
          <Input value={form.model_number} onChange={e => update('model_number', e.target.value)} placeholder="e.g. RC-3001" />
        </div>
        <div>
          <FieldLabel>{lang === 'ar' ? 'كود المصنع' : 'Manufacturer Code'}</FieldLabel>
          <Input value={form.manufacturer_product_code} onChange={e => update('manufacturer_product_code', e.target.value)} placeholder="e.g. MFG-00123" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel required>{lang === 'ar' ? 'وصف مختصر (عربي)' : 'Short Description (Arabic)'}</FieldLabel>
          <Textarea value={form.short_description_ar} onChange={e => update('short_description_ar', e.target.value)} placeholder="وصف مختصر بالعربية…" rows={2} />
        </div>
        <div>
          <FieldLabel required>Short Description (English)</FieldLabel>
          <Textarea value={form.short_description_en} onChange={e => update('short_description_en', e.target.value)} placeholder="Short English description…" rows={2} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <FieldLabel>{lang === 'ar' ? 'وصف كامل (عربي)' : 'Full Description (Arabic)'}</FieldLabel>
          <Textarea value={form.full_description_ar} onChange={e => update('full_description_ar', e.target.value)} placeholder="وصف تفصيلي كامل بالعربية…" rows={4} />
        </div>
        <div>
          <FieldLabel>Full Description (English)</FieldLabel>
          <Textarea value={form.full_description_en} onChange={e => update('full_description_en', e.target.value)} placeholder="Full English product description…" rows={4} />
        </div>
      </div>
    </div>
  );
}

// ─── STEP 2: Specifications ───────────────────────────────────
function Step2({ form, update, lang }) {
  const templateSpecs = CATEGORY_SPECS[form.category_id] || [];
  const specs = form.specifications;

  const addSpec = () => update('specifications', [...specs, { ...EMPTY_SPEC }]);
  const removeSpec = (i) => update('specifications', specs.filter((_, idx) => idx !== i));
  const updateSpec = (i, field, val) => {
    const next = [...specs];
    next[i] = { ...next[i], [field]: val };
    update('specifications', next);
  };
  const addTemplate = (name) => {
    if (specs.some(s => s.specification_name_en === name)) return;
    update('specifications', [...specs, { specification_name_en: name, value: '', unit: '' }]);
  };

  return (
    <div className="space-y-5">
      {templateSpecs.length > 0 && (
        <Card>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#6E5847' }}>
            {lang === 'ar' ? 'مواصفات شائعة لهذا التصنيف (اضغط لإضافة)' : 'Common specs for this category (click to add)'}
          </p>
          <div className="flex flex-wrap gap-2">
            {templateSpecs.map(s => {
              const added = specs.some(sp => sp.specification_name_en === s);
              return (
                <button key={s} type="button" onClick={() => addTemplate(s)}
                  className="px-3 py-1 rounded-full text-xs font-medium border transition-all"
                  style={{ background: added ? GOLD + '20' : 'white', borderColor: added ? GOLD : SAND, color: added ? DARK : '#6E5847' }}>
                  {added ? '✓ ' : '+ '}{s}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {specs.map((s, i) => (
          <Card key={i} className="flex items-start gap-3">
            <div className="grid grid-cols-3 gap-3 flex-1">
              <div>
                <FieldLabel>Specification Name</FieldLabel>
                <Input value={s.specification_name_en} onChange={e => updateSpec(i, 'specification_name_en', e.target.value)} placeholder="e.g. Width" />
              </div>
              <div>
                <FieldLabel>Value</FieldLabel>
                <Input value={s.value} onChange={e => updateSpec(i, 'value', e.target.value)} placeholder="e.g. 220" />
              </div>
              <div>
                <FieldLabel>Unit</FieldLabel>
                <Input value={s.unit} onChange={e => updateSpec(i, 'unit', e.target.value)} placeholder="cm, kg, W…" />
              </div>
            </div>
            <div className="pt-6"><IconBtn onClick={() => removeSpec(i)} icon={<Trash2 size={13} />} danger /></div>
          </Card>
        ))}
      </div>

      <AddBtn onClick={addSpec} labelEn="Add Specification" labelAr="إضافة مواصفة" lang={lang} />
    </div>
  );
}

// ─── STEP 3: Materials ────────────────────────────────────────
function Step3({ form, update, lang }) {
  const mats = form.materials;
  const addMat = () => update('materials', [...mats, { ...EMPTY_MATERIAL }]);
  const removeMat = (i) => update('materials', mats.filter((_, idx) => idx !== i));
  const updateMat = (i, field, val) => {
    const next = [...mats];
    next[i] = { ...next[i], [field]: val };
    update('materials', next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: '#6E5847' }}>
        {lang === 'ar'
          ? 'سجّل المواد المستخدمة في صنع هذا المنتج. هذه البيانات ضرورية لاحقًا لاستخراج الكميات (BOQ).'
          : 'Record the materials used to manufacture this product. This data will be used for BOQ extraction.'}
      </p>

      {mats.map((m, i) => (
        <Card key={i}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              {lang === 'ar' ? `مادة ${i + 1}` : `Material ${i + 1}`}
            </span>
            {mats.length > 1 && <IconBtn onClick={() => removeMat(i)} icon={<Trash2 size={13} />} danger />}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <FieldLabel>Material Name (EN)</FieldLabel>
              <Input value={m.material_name_en} onChange={e => updateMat(i, 'material_name_en', e.target.value)} placeholder="e.g. Fabric" />
            </div>
            <div>
              <FieldLabel>Type</FieldLabel>
              <Select value={m.material_type} onChange={e => updateMat(i, 'material_type', e.target.value)}>
                <option value="">— Select —</option>
                {MATERIAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Color / Finish</FieldLabel>
              <Input value={m.color} onChange={e => updateMat(i, 'color', e.target.value)} placeholder="Beige Velvet" />
            </div>
            <div>
              <FieldLabel>Qty / Product</FieldLabel>
              <Input type="number" value={m.quantity_per_product} onChange={e => updateMat(i, 'quantity_per_product', e.target.value)} placeholder="6" />
            </div>
            <div>
              <FieldLabel>Unit</FieldLabel>
              <Select value={m.unit} onChange={e => updateMat(i, 'unit', e.target.value)}>
                {UNITS.map(u => <option key={u.id} value={u.id}>{u.id}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Waste % <span className="normal-case font-normal">(optional)</span></FieldLabel>
              <Input type="number" value={m.waste_percentage} onChange={e => updateMat(i, 'waste_percentage', e.target.value)} placeholder="5" />
            </div>
            <div>
              <FieldLabel>Unit Cost (SAR) <span className="normal-case font-normal">(optional)</span></FieldLabel>
              <Input type="number" value={m.unit_cost} onChange={e => updateMat(i, 'unit_cost', e.target.value)} placeholder="0.00" />
            </div>
          </div>
        </Card>
      ))}

      <AddBtn onClick={addMat} labelEn="Add Material" labelAr="إضافة مادة" lang={lang} />
    </div>
  );
}

// ─── STEP 4: Components ───────────────────────────────────────
function Step4({ form, update, lang }) {
  const comps = form.components;
  const addComp = () => update('components', [...comps, { ...EMPTY_COMPONENT }]);
  const removeComp = (i) => update('components', comps.filter((_, idx) => idx !== i));
  const updateComp = (i, field, val) => {
    const next = [...comps];
    next[i] = { ...next[i], [field]: val };
    update('components', next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: '#6E5847' }}>
        {lang === 'ar'
          ? 'اختياري: سجّل الأجزاء المكوّنة للمنتج (مثال: طقم كنب = 3 مقاعد + طاولة).'
          : 'Optional: List parts that make up this product (e.g. sofa set = 3 seats + table).'}
      </p>

      {comps.length === 0 && (
        <Card>
          <p className="text-center text-sm py-4" style={{ color: '#B68D57' }}>
            {lang === 'ar' ? 'لا مكونات مضافة بعد' : 'No components added yet'}
          </p>
        </Card>
      )}

      {comps.map((c, i) => (
        <Card key={i}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              {lang === 'ar' ? `مكوّن ${i + 1}` : `Component ${i + 1}`}
            </span>
            <IconBtn onClick={() => removeComp(i)} icon={<Trash2 size={13} />} danger />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <FieldLabel>Component Name (EN)</FieldLabel>
              <Input value={c.component_name_en} onChange={e => updateComp(i, 'component_name_en', e.target.value)} placeholder="e.g. Table Top" />
            </div>
            <div>
              <FieldLabel>Quantity</FieldLabel>
              <Input type="number" value={c.quantity} onChange={e => updateComp(i, 'quantity', e.target.value)} placeholder="1" />
            </div>
            <div>
              <FieldLabel>Unit</FieldLabel>
              <Select value={c.unit} onChange={e => updateComp(i, 'unit', e.target.value)}>
                {UNITS.map(u => <option key={u.id} value={u.id}>{u.id}</option>)}
              </Select>
            </div>
            <div className="md:col-span-4">
              <FieldLabel>Notes</FieldLabel>
              <Input value={c.notes} onChange={e => updateComp(i, 'notes', e.target.value)} placeholder="Optional notes…" />
            </div>
          </div>
        </Card>
      ))}

      <AddBtn onClick={addComp} labelEn="Add Component" labelAr="إضافة مكوّن" lang={lang} />
    </div>
  );
}

// ─── STEP 5: Files ────────────────────────────────────────────
function Step5({ form, update, lang }) {
  const files = form.files;
  const addFile = () => update('files', [...files, { ...EMPTY_FILE }]);
  const removeFile = (i) => update('files', files.filter((_, idx) => idx !== i));
  const updateFile = (i, field, val) => {
    const next = [...files];
    if (field === 'is_primary') next.forEach((f, idx) => { next[idx] = { ...f, is_primary: idx === i }; });
    else next[i] = { ...next[i], [field]: val };
    update('files', next);
  };
  const handleFileInput = (i, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toUpperCase();
    updateFile(i, 'file_name_original', file.name);
    updateFile(i, 'file_size', file.size);
    if (FILE_FORMATS.includes(ext)) updateFile(i, 'file_format', ext);
  };

  const fmt = (bytes) => {
    if (!bytes) return '—';
    if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + ' MB';
    return (bytes / 1e3).toFixed(0) + ' KB';
  };

  const ALLOWED_TYPES = '.rfa,.rvt,.max,.fbx,.obj,.skp,.dwg,.ifc,.pdf,.zip';

  return (
    <div className="space-y-4">
      <Card style={{ borderColor: GOLD + '40', background: GOLD + '08' }}>
        <div className="flex gap-2">
          <Info size={15} style={{ color: GOLD, flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs" style={{ color: DARK }}>
            {lang === 'ar'
              ? 'الصيغ المقبولة: RFA, RVT, MAX, FBX, OBJ, SKP, DWG, IFC, PDF, ZIP — الحد الأقصى: 100 MB لكل ملف.'
              : 'Accepted formats: RFA, RVT, MAX, FBX, OBJ, SKP, DWG, IFC, PDF, ZIP — Max 100 MB per file.'}
          </p>
        </div>
      </Card>

      {files.map((f, i) => (
        <Card key={i}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              {lang === 'ar' ? `ملف ${i + 1}` : `File ${i + 1}`}
              {f.is_primary && <span className="ms-2 px-2 py-0.5 rounded-full text-[10px]" style={{ background: GOLD + '20', color: DARK }}>Primary</span>}
            </span>
            {files.length > 1 && <IconBtn onClick={() => removeFile(i)} icon={<Trash2 size={13} />} danger />}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            <div>
              <FieldLabel>Software</FieldLabel>
              <Select value={f.software_name} onChange={e => updateFile(i, 'software_name', e.target.value)}>
                {SOFTWARE_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <FieldLabel>Version</FieldLabel>
              <Input value={f.software_version} onChange={e => updateFile(i, 'software_version', e.target.value)} placeholder="2024" />
            </div>
            <div>
              <FieldLabel>Format</FieldLabel>
              <Select value={f.file_format} onChange={e => updateFile(i, 'file_format', e.target.value)}>
                {FILE_FORMATS.map(fmt => <option key={fmt} value={fmt}>.{fmt.toLowerCase()}</option>)}
              </Select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={f.is_primary} onChange={() => updateFile(i, 'is_primary', true)}
                  className="accent-gold" style={{ accentColor: GOLD }} />
                <span className="text-sm" style={{ color: DARK }}>Primary file</span>
              </label>
            </div>
          </div>
          <label className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-dashed cursor-pointer hover:opacity-80 transition-all"
            style={{ borderColor: SAND }}>
            <Upload size={18} style={{ color: GOLD }} />
            <span className="text-sm" style={{ color: '#6E5847' }}>
              {f.file_name_original
                ? `${f.file_name_original} (${fmt(f.file_size)})`
                : (lang === 'ar' ? 'انقر لاختيار الملف أو اسحبه هنا' : 'Click to select file or drag & drop')}
            </span>
            <input type="file" className="hidden" accept={ALLOWED_TYPES} onChange={e => handleFileInput(i, e)} />
          </label>
        </Card>
      ))}

      <AddBtn onClick={addFile} labelEn="Add Another File" labelAr="إضافة ملف آخر" lang={lang} />
    </div>
  );
}

// ─── STEP 6: Images ───────────────────────────────────────────
function Step6({ form, update, lang }) {
  const images = form.images;
  const handleImg = (e) => {
    const files = Array.from(e.target.files || []);
    const newImgs = files.map((f, i) => ({
      image_type: 'render', alt_text_en: '', alt_text_ar: '',
      is_primary: images.length === 0 && i === 0,
      fileName: f.name, fileSize: f.size,
      preview: URL.createObjectURL(f),
    }));
    update('images', [...images, ...newImgs]);
  };
  const removeImg = (i) => update('images', images.filter((_, idx) => idx !== i));
  const setPrimary = (i) => update('images', images.map((img, idx) => ({ ...img, is_primary: idx === i })));
  const IMAGE_TYPES = ['render','dimension','material','catalogue','lifestyle','other'];

  return (
    <div className="space-y-5">
      <label className="flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed cursor-pointer hover:opacity-80 transition-all"
        style={{ borderColor: SAND }}>
        <ImgIcon size={32} style={{ color: GOLD }} />
        <div className="text-center">
          <p className="font-semibold" style={{ color: DARK }}>
            {lang === 'ar' ? 'انقر لرفع الصور' : 'Click to upload images'}
          </p>
          <p className="text-xs mt-1" style={{ color: '#6E5847' }}>
            {lang === 'ar' ? 'JPG, PNG, WEBP — حد أقصى 20 MB لكل صورة' : 'JPG, PNG, WEBP — Max 20 MB each'}
          </p>
        </div>
        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImg} />
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div key={i} className="rounded-xl border overflow-hidden" style={{ borderColor: img.is_primary ? GOLD : SAND }}>
              {img.preview
                ? <img src={img.preview} alt="" className="w-full h-32 object-cover" />
                : <div className="w-full h-32 flex items-center justify-center" style={{ background: BEIGE }}>
                    <ImgIcon size={24} style={{ color: SAND }} />
                  </div>
              }
              <div className="p-3 space-y-2">
                <select value={img.image_type} className="w-full text-xs px-2 py-1 rounded-lg border"
                  style={{ borderColor: SAND, background: IVORY }}
                  onChange={e => { const n=[...images]; n[i]={...n[i],image_type:e.target.value}; update('images',n); }}>
                  {IMAGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPrimary(i)}
                    className="flex-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-all"
                    style={{ background: img.is_primary ? GOLD : BEIGE, color: img.is_primary ? 'white' : DARK }}>
                    {img.is_primary ? '★ Primary' : 'Set Primary'}
                  </button>
                  <IconBtn onClick={() => removeImg(i)} icon={<Trash2 size={12} />} danger />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── STEP 7: Pricing ─────────────────────────────────────────
function Step7({ form, update, lang }) {
  return (
    <div className="space-y-5">
      <Card>
        <FieldLabel>{lang === 'ar' ? 'نوع التسعير' : 'Pricing Type'}</FieldLabel>
        <div className="flex gap-4 mt-2">
          {[
            { val: true,  labelEn: 'Free Download',  labelAr: 'تحميل مجاني' },
            { val: false, labelEn: 'Paid / Premium',  labelAr: 'مدفوع' },
          ].map(opt => (
            <label key={String(opt.val)} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={form.is_free === opt.val}
                onChange={() => update('is_free', opt.val)}
                style={{ accentColor: GOLD }} />
              <span className="text-sm font-medium" style={{ color: DARK }}>
                {lang === 'ar' ? opt.labelAr : opt.labelEn}
              </span>
            </label>
          ))}
        </div>
      </Card>

      {!form.is_free && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>{lang === 'ar' ? 'السعر' : 'Price'}</FieldLabel>
            <Input type="number" value={form.price} onChange={e => update('price', e.target.value)} placeholder="0.00" />
          </div>
          <div>
            <FieldLabel>{lang === 'ar' ? 'العملة' : 'Currency'}</FieldLabel>
            <Select value={form.currency} onChange={e => update('currency', e.target.value)}>
              {['SAR','USD','AED','KWD','QAR','BHD','OMR','EGP'].map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <FieldLabel>{lang === 'ar' ? 'مدة التوريد' : 'Lead Time'}</FieldLabel>
          <Input value={form.lead_time} onChange={e => update('lead_time', e.target.value)} placeholder="e.g. 2-4 weeks" />
        </div>
        <div>
          <FieldLabel>{lang === 'ar' ? 'الحد الأدنى للطلب' : 'Min Order Qty'}</FieldLabel>
          <Input type="number" value={form.min_order_qty} onChange={e => update('min_order_qty', e.target.value)} placeholder="1" />
        </div>
        <div className="flex items-end pb-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.in_stock} onChange={e => update('in_stock', e.target.checked)}
              style={{ accentColor: GOLD }} />
            <span className="text-sm" style={{ color: DARK }}>{lang === 'ar' ? 'متوفر الآن' : 'In Stock'}</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── STEP 8: License ─────────────────────────────────────────
function Step8({ form, update, lang }) {
  const checks = [
    { key: 'rights_confirmed',    labelEn: 'I confirm I own the rights to upload this product and its files.', labelAr: 'أؤكد أنني أملك حقوق رفع هذا المنتج وملفاته.', required: true },
    { key: 'license_download',    labelEn: 'Allow users to download the files.',        labelAr: 'السماح للمستخدمين بتحميل الملفات.' },
    { key: 'license_commercial',  labelEn: 'Allow commercial use.',                     labelAr: 'السماح بالاستخدام التجاري.' },
    { key: 'license_modify',      labelEn: 'Allow modification.',                       labelAr: 'السماح بالتعديل.' },
    { key: 'license_redistribute',labelEn: 'Allow redistribution.',                    labelAr: 'السماح بإعادة التوزيع.' },
    { key: 'agreed_to_terms',     labelEn: 'I agree to the BUAD Platform Terms of Use.', labelAr: 'أوافق على شروط استخدام منصة بُعد.', required: true },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel>{lang === 'ar' ? 'نوع الترخيص' : 'License Type'}</FieldLabel>
          <Select value={form.license_type} onChange={e => update('license_type', e.target.value)}>
            {LICENSE_TYPES.map(l => <option key={l} value={l}>{l}</option>)}
          </Select>
        </div>
        <div>
          <FieldLabel>{lang === 'ar' ? 'رابط المصدر' : 'Source URL'}</FieldLabel>
          <Input value={form.source_url} onChange={e => update('source_url', e.target.value)} placeholder="https://…" type="url" />
        </div>
      </div>

      <Card>
        <div className="space-y-3">
          {checks.map(c => (
            <label key={c.key} className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={!!form[c.key]} onChange={e => update(c.key, e.target.checked)}
                className="mt-0.5 flex-shrink-0" style={{ accentColor: GOLD }} />
              <span className="text-sm" style={{ color: DARK }}>
                {lang === 'ar' ? c.labelAr : c.labelEn}
                {c.required && <span style={{ color: '#ef4444' }}> *</span>}
              </span>
            </label>
          ))}
        </div>
      </Card>

      <Card style={{ background: '#fef9ec', borderColor: '#f59e0b40' }}>
        <div className="flex gap-2">
          <AlertCircle size={15} style={{ color: '#d97706', flexShrink: 0, marginTop: 2 }} />
          <p className="text-xs" style={{ color: '#92400e' }}>
            {lang === 'ar'
              ? 'لن يتم إرسال المنتج للمراجعة قبل تأكيد امتلاك الحقوق والموافقة على شروط الاستخدام.'
              : 'The product cannot be submitted for review without confirming rights ownership and agreeing to the terms.'}
          </p>
        </div>
      </Card>
    </div>
  );
}

// ─── STEP 9: Review & Submit ──────────────────────────────────
function Step9({ form, buodRef, lang }) {
  const cat  = CATEGORIES.find(c => c.id === form.category_id);
  const subs = SUBCATEGORIES[form.category_id] || [];
  const sub  = subs.find(s => s.id === form.subcategory_id);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    if (buodRef) navigator.clipboard.writeText(buodRef).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const Row = ({ label, value }) => (
    value ? (
      <div className="flex justify-between py-2 border-b text-sm" style={{ borderColor: SAND }}>
        <span style={{ color: '#6E5847' }}>{label}</span>
        <span className="font-semibold text-right max-w-xs truncate" style={{ color: DARK }}>{value}</span>
      </div>
    ) : null
  );

  return (
    <div className="space-y-5">
      {buodRef && (
        <Card style={{ borderColor: GOLD + '60', background: GOLD + '08' }}>
          <p className="text-xs uppercase tracking-widest mb-1" style={{ color: '#6E5847' }}>
            {lang === 'ar' ? 'الرقم المرجعي BUAD' : 'BUAD Reference Number'}
          </p>
          <div className="flex items-center gap-3">
            <span className="font-black text-lg font-mono tracking-wider" style={{ color: DARK }}>{buodRef}</span>
            <button type="button" onClick={copy}
              className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: GOLD, color: 'white' }}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? (lang === 'ar' ? 'تم' : 'Copied') : (lang === 'ar' ? 'نسخ' : 'Copy')}
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: '#6E5847' }}>
            {lang === 'ar'
              ? 'احتفظ بهذا الرقم — سيُستخدم لاحقًا لربط الموديل في Revit.'
              : 'Keep this number — it will be used to link the model in Revit.'}
          </p>
        </Card>
      )}

      <Card>
        <p className="font-bold mb-3" style={{ color: DARK }}>
          {lang === 'ar' ? 'ملخص البيانات' : 'Summary'}
        </p>
        <Row label={lang === 'ar' ? 'الاسم (عربي)' : 'Name (AR)'} value={form.product_name_ar} />
        <Row label={lang === 'ar' ? 'الاسم (إنجليزي)' : 'Name (EN)'} value={form.product_name_en} />
        <Row label={lang === 'ar' ? 'التصنيف' : 'Category'} value={cat ? `${cat.icon} ${cat.nameEn}` : '—'} />
        <Row label={lang === 'ar' ? 'التصنيف الفرعي' : 'Sub-category'} value={sub?.nameEn} />
        <Row label={lang === 'ar' ? 'العلامة التجارية' : 'Brand'} value={form.brand_name} />
        <Row label={lang === 'ar' ? 'الوحدة' : 'Unit'} value={form.unit} />
        <Row label={lang === 'ar' ? 'الترخيص' : 'License'} value={form.license_type} />
        <Row label={lang === 'ar' ? 'التسعير' : 'Pricing'} value={form.is_free ? 'Free' : `${form.price} ${form.currency}`} />
        <Row label={lang === 'ar' ? 'المواصفات' : 'Specifications'} value={`${form.specifications.length} item(s)`} />
        <Row label={lang === 'ar' ? 'المواد' : 'Materials'} value={form.materials.filter(m => m.material_name_en).length + ' item(s)'} />
        <Row label={lang === 'ar' ? 'المكونات' : 'Components'} value={form.components.filter(c => c.component_name_en).length + ' item(s)'} />
        <Row label={lang === 'ar' ? 'الملفات' : 'Files'} value={form.files.filter(f => f.file_name_original).length + ' file(s)'} />
        <Row label={lang === 'ar' ? 'الصور' : 'Images'} value={form.images.length + ' image(s)'} />
      </Card>
    </div>
  );
}

// ─── Stepper ──────────────────────────────────────────────────
function Stepper({ current, lang }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STEPS.map((s, i) => {
        const done    = s.id < current;
        const active  = s.id === current;
        return (
          <div key={s.id} className="flex items-center gap-1 flex-shrink-0">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={{
                  background: done ? GOLD : active ? DARK : BEIGE,
                  color:      done ? 'white' : active ? 'white' : '#6E5847',
                }}>
                {done ? <Check size={13} /> : s.icon}
              </div>
              <span className="text-[9px] text-center leading-tight max-w-[56px] hidden sm:block"
                style={{ color: active ? DARK : '#9E8E7E', fontWeight: active ? 600 : 400 }}>
                {lang === 'ar' ? s.labelAr : s.labelEn}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className="w-6 h-0.5 mb-4 flex-shrink-0" style={{ background: done ? GOLD : SAND }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Progress indicator ───────────────────────────────────────
function CompletionBar({ form }) {
  const checks = [
    form.product_name_ar, form.product_name_en,
    form.category_id, form.subcategory_id,
    form.short_description_ar, form.unit,
    form.files.some(f => f.file_name_original),
    form.rights_confirmed, form.agreed_to_terms,
  ];
  const pct = Math.round((checks.filter(Boolean).length / checks.length) * 100);
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs mb-1" style={{ color: '#6E5847' }}>
        <span>Completeness</span>
        <span className="font-bold" style={{ color: pct >= 80 ? '#16a34a' : GOLD }}>{pct}%</span>
      </div>
      <div className="w-full h-1.5 rounded-full" style={{ background: SAND }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: pct + '%', background: pct >= 80 ? '#16a34a' : GOLD }} />
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────
export default function AddProduct() {
  const { t, lang }   = useLanguage();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState({ ...INITIAL_FORM });
  const [draftId, setDraftId]   = useState(null);
  const [buodRef, setBuodRef]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [submitting, setSub]    = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [errors, setErrors]     = useState([]);

  const update = useCallback((field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  }, []);

  const validate = () => {
    const errs = [];
    if (!form.product_name_ar)     errs.push(lang === 'ar' ? 'اسم المنتج بالعربية مطلوب' : 'Arabic product name required');
    if (!form.product_name_en)     errs.push(lang === 'ar' ? 'اسم المنتج بالإنجليزية مطلوب' : 'English product name required');
    if (!form.category_id)         errs.push(lang === 'ar' ? 'التصنيف مطلوب' : 'Category required');
    if (!form.subcategory_id)      errs.push(lang === 'ar' ? 'التصنيف الفرعي مطلوب' : 'Sub-category required');
    if (!form.short_description_ar) errs.push(lang === 'ar' ? 'الوصف المختصر مطلوب' : 'Short description required');
    if (!form.files.some(f => f.file_name_original)) errs.push(lang === 'ar' ? 'ملف واحد على الأقل مطلوب' : 'At least one file required');
    if (!form.rights_confirmed)    errs.push(lang === 'ar' ? 'يجب تأكيد ملكية الحقوق' : 'Rights confirmation required');
    if (!form.agreed_to_terms)     errs.push(lang === 'ar' ? 'يجب الموافقة على شروط الاستخدام' : 'Must agree to terms');
    return errs;
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const p = await productService.createProduct(user?.id || 'u-guest', { ...form, status: 'draft', visibility: 'private' });
      setDraftId(p.id);
      setSavedMsg(lang === 'ar' ? '✓ تم حفظ المسودة' : '✓ Draft saved');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (e) {
      setSavedMsg('Error: ' + e.message);
    }
    setSaving(false);
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setSub(true);
    try {
      const p = await productService.createProduct(user?.id || 'u-guest', { ...form, status: 'pending_review' });
      setBuodRef(p.buod_reference);
      setDraftId(p.id);
      setSavedMsg(lang === 'ar' ? '✓ أُرسل للمراجعة' : '✓ Submitted for review');
    } catch (e) {
      setErrors([e.message]);
    }
    setSub(false);
  };

  const stepProps = { form, update, lang };
  const STEP_COMPONENTS = [Step1, Step2, Step3, Step4, Step5, Step6, Step7, Step8, Step9];
  const CurrentStep = STEP_COMPONENTS[step - 1];

  return (
    <div className="min-h-screen" style={{ background: BEIGE }}>
      {/* Header */}
      <div className="border-b" style={{ background: DARK, borderColor: '#3A2A18' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-black text-white text-lg" style={{ fontFamily: 'Cairo, sans-serif' }}>
              {t('Add New Product', 'إضافة منتج جديد')}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#B68D57' }}>
              {t('Step', 'الخطوة')} {step} {t('of', 'من')} {STEPS.length}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigate('/my-products')}
              className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:opacity-80"
              style={{ borderColor: '#4A3A28', color: '#C4A882' }}>
              {t('My Products', 'منتجاتي')}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Stepper */}
        <div className="mb-6 p-4 rounded-2xl" style={{ background: 'white', border: `1px solid ${SAND}` }}>
          <Stepper current={step} lang={lang} />
        </div>

        {/* Completion */}
        <CompletionBar form={form} />

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
            <Card className="mb-5">
              <div className="flex items-center gap-2 mb-5 pb-4 border-b" style={{ borderColor: SAND }}>
                <span className="text-xl">{STEPS[step - 1].icon}</span>
                <h2 className="font-bold text-lg" style={{ color: DARK, fontFamily: 'Cairo, sans-serif' }}>
                  {lang === 'ar' ? STEPS[step - 1].labelAr : STEPS[step - 1].labelEn}
                </h2>
              </div>

              {step === 9
                ? <Step9 form={form} buodRef={buodRef} lang={lang} />
                : <CurrentStep {...stepProps} />
              }
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 rounded-xl border" style={{ background: '#fee2e2', borderColor: '#fca5a5' }}>
            {errors.map((e, i) => (
              <p key={i} className="text-sm text-red-700">• {e}</p>
            ))}
          </div>
        )}

        {/* Save msg */}
        {savedMsg && (
          <div className="mb-4 p-3 rounded-xl text-sm font-semibold text-center"
            style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac' }}>
            {savedMsg}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:opacity-80 disabled:opacity-30"
            style={{ borderColor: SAND, color: DARK }}>
            <ChevronLeft size={16} />
            {t('Previous', 'السابق')}
          </button>

          <div className="flex gap-2">
            <button type="button" onClick={handleSaveDraft} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all hover:opacity-80"
              style={{ borderColor: GOLD, color: GOLD, background: GOLD + '10' }}>
              <Save size={14} />
              {saving ? '…' : t('Save Draft', 'حفظ مسودة')}
            </button>

            {step < STEPS.length ? (
              <button type="button" onClick={() => setStep(s => Math.min(STEPS.length, s + 1))}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: DARK, color: IVORY }}>
                {t('Next', 'التالي')}
                <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:opacity-90"
                style={{ background: GOLD, color: DARK }}>
                <Send size={14} />
                {submitting ? '…' : t('Submit for Review', 'إرسال للمراجعة')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
