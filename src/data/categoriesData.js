export const CATEGORIES = [
  { id: 'FUR', code: 'FUR', icon: '🛋️', nameEn: 'Furniture',       nameAr: 'أثاث' },
  { id: 'LGT', code: 'LGT', icon: '💡', nameEn: 'Lighting',        nameAr: 'إضاءة' },
  { id: 'KIT', code: 'KIT', icon: '🍳', nameEn: 'Kitchen',         nameAr: 'مطبخ' },
  { id: 'BTH', code: 'BTH', icon: '🚿', nameEn: 'Bathroom',        nameAr: 'حمامات' },
  { id: 'DOR', code: 'DOR', icon: '🚪', nameEn: 'Doors',           nameAr: 'أبواب' },
  { id: 'WIN', code: 'WIN', icon: '🪟', nameEn: 'Windows',         nameAr: 'نوافذ' },
  { id: 'FLR', code: 'FLR', icon: '◼️', nameEn: 'Flooring',        nameAr: 'أرضيات' },
  { id: 'WAL', code: 'WAL', icon: '🧱', nameEn: 'Wall Finishes',   nameAr: 'تشطيبات جدران' },
  { id: 'CEL', code: 'CEL', icon: '⬜', nameEn: 'Ceiling',         nameAr: 'أسقف' },
  { id: 'DEC', code: 'DEC', icon: '🎨', nameEn: 'Decoration',      nameAr: 'ديكور' },
  { id: 'OFF', code: 'OFF', icon: '🖥️', nameEn: 'Office',          nameAr: 'مكتبي' },
  { id: 'OUT', code: 'OUT', icon: '🌿', nameEn: 'Outdoor',         nameAr: 'خارجي' },
  { id: 'LND', code: 'LND', icon: '🌳', nameEn: 'Landscape',       nameAr: 'تنسيق موقع' },
  { id: 'SAN', code: 'SAN', icon: '🚰', nameEn: 'Sanitary',        nameAr: 'صحي' },
  { id: 'ELC', code: 'ELC', icon: '⚡', nameEn: 'Electrical',      nameAr: 'كهرباء' },
  { id: 'MCH', code: 'MCH', icon: '⚙️', nameEn: 'Mechanical',      nameAr: 'ميكانيكا' },
  { id: 'ARC', code: 'ARC', icon: '🏛️', nameEn: 'Architectural',   nameAr: 'معماري' },
  { id: 'STR', code: 'STR', icon: '🏗️', nameEn: 'Structural',      nameAr: 'إنشائي' },
];

export const SUBCATEGORIES = {
  FUR: [
    { id: 'SOF', code: 'SOF', nameEn: 'Sofas & Sectionals', nameAr: 'كنب وجلسات' },
    { id: 'CHR', code: 'CHR', nameEn: 'Chairs',             nameAr: 'كراسي' },
    { id: 'TBL', code: 'TBL', nameEn: 'Tables',             nameAr: 'طاولات' },
    { id: 'BED', code: 'BED', nameEn: 'Beds',               nameAr: 'أسرة' },
    { id: 'STG', code: 'STG', nameEn: 'Storage & Shelving', nameAr: 'خزائن وأرفف' },
    { id: 'OTH', code: 'OTH', nameEn: 'Other',              nameAr: 'أخرى' },
  ],
  LGT: [
    { id: 'PEN', code: 'PEN', nameEn: 'Pendant',            nameAr: 'معلقة' },
    { id: 'CEL', code: 'CEL', nameEn: 'Ceiling',            nameAr: 'سقفية' },
    { id: 'WLL', code: 'WLL', nameEn: 'Wall',               nameAr: 'جدارية' },
    { id: 'FLR', code: 'FLR', nameEn: 'Floor',              nameAr: 'أرضية' },
    { id: 'TAB', code: 'TAB', nameEn: 'Table',              nameAr: 'طاولة' },
    { id: 'OUT', code: 'OUT', nameEn: 'Outdoor',            nameAr: 'خارجية' },
    { id: 'REC', code: 'REC', nameEn: 'Recessed',           nameAr: 'مدفونة' },
  ],
  KIT: [
    { id: 'CAB', code: 'CAB', nameEn: 'Cabinets',           nameAr: 'خزائن' },
    { id: 'CNT', code: 'CNT', nameEn: 'Countertops',        nameAr: 'أسطح عمل' },
    { id: 'SNK', code: 'SNK', nameEn: 'Sinks',              nameAr: 'أحواض' },
    { id: 'APL', code: 'APL', nameEn: 'Appliances',         nameAr: 'أجهزة' },
  ],
  BTH: [
    { id: 'SAN', code: 'SAN', nameEn: 'Sanitary Ware',      nameAr: 'أدوات صحية' },
    { id: 'VNT', code: 'VNT', nameEn: 'Vanity',             nameAr: 'وحدة مغسلة' },
    { id: 'SHW', code: 'SHW', nameEn: 'Shower',             nameAr: 'دوش' },
    { id: 'BTB', code: 'BTB', nameEn: 'Bathtub',            nameAr: 'حوض استحمام' },
    { id: 'ACC', code: 'ACC', nameEn: 'Accessories',        nameAr: 'إكسسوار' },
  ],
  DOR: [
    { id: 'WOD', code: 'WOD', nameEn: 'Wood',               nameAr: 'خشبي' },
    { id: 'MTL', code: 'MTL', nameEn: 'Metal',              nameAr: 'معدني' },
    { id: 'GLS', code: 'GLS', nameEn: 'Glass',              nameAr: 'زجاجي' },
    { id: 'FIR', code: 'FIR', nameEn: 'Fire Rated',         nameAr: 'مقاوم للحريق' },
  ],
  WIN: [
    { id: 'FRM', code: 'FRM', nameEn: 'Framed',             nameAr: 'مؤطر' },
    { id: 'FRL', code: 'FRL', nameEn: 'Frameless',          nameAr: 'بدون إطار' },
    { id: 'SKY', code: 'SKY', nameEn: 'Skylight',           nameAr: 'منور' },
    { id: 'CRN', code: 'CRN', nameEn: 'Corner',             nameAr: 'زاوية' },
  ],
  FLR: [
    { id: 'PRQ', code: 'PRQ', nameEn: 'Parquet',            nameAr: 'باركيه' },
    { id: 'TIL', code: 'TIL', nameEn: 'Tiles',              nameAr: 'بلاط' },
    { id: 'MRB', code: 'MRB', nameEn: 'Marble',             nameAr: 'رخام' },
    { id: 'CRP', code: 'CRP', nameEn: 'Carpet',             nameAr: 'سجاد' },
    { id: 'EXP', code: 'EXP', nameEn: 'Epoxy',              nameAr: 'إيبوكسي' },
  ],
  WAL: [
    { id: 'PNT', code: 'PNT', nameEn: 'Paint',              nameAr: 'دهان' },
    { id: 'WLP', code: 'WLP', nameEn: 'Wallpaper',          nameAr: 'ورق جدران' },
    { id: 'STN', code: 'STN', nameEn: 'Stone Cladding',     nameAr: 'تكسية حجر' },
    { id: 'WDP', code: 'WDP', nameEn: 'Wood Panel',         nameAr: 'تكسية خشب' },
  ],
  CEL: [
    { id: 'GYP', code: 'GYP', nameEn: 'Gypsum',             nameAr: 'جبس' },
    { id: 'ACT', code: 'ACT', nameEn: 'Acoustic Tiles',     nameAr: 'بلاط صوتي' },
    { id: 'STR', code: 'STR', nameEn: 'Stretch Ceiling',    nameAr: 'سقف مشدود' },
  ],
  DEC: [
    { id: 'VAS', code: 'VAS', nameEn: 'Vases & Objects',    nameAr: 'مزهريات وتحف' },
    { id: 'ART', code: 'ART', nameEn: 'Art & Frames',       nameAr: 'لوحات وإطارات' },
    { id: 'MIR', code: 'MIR', nameEn: 'Mirrors',            nameAr: 'مرايا' },
    { id: 'RUG', code: 'RUG', nameEn: 'Rugs',               nameAr: 'سجاد' },
    { id: 'CUS', code: 'CUS', nameEn: 'Cushions & Throws',  nameAr: 'وسائد وأغطية' },
  ],
  OFF: [
    { id: 'DSK', code: 'DSK', nameEn: 'Desks',              nameAr: 'مكاتب' },
    { id: 'OCH', code: 'OCH', nameEn: 'Office Chairs',      nameAr: 'كراسي مكتبية' },
    { id: 'CAB', code: 'CAB', nameEn: 'Filing & Storage',   nameAr: 'أدراج وتخزين' },
    { id: 'WRK', code: 'WRK', nameEn: 'Workstations',       nameAr: 'محطات عمل' },
  ],
  OUT: [
    { id: 'FUR', code: 'FUR', nameEn: 'Outdoor Furniture',  nameAr: 'أثاث خارجي' },
    { id: 'PVN', code: 'PVN', nameEn: 'Paving',             nameAr: 'تبليط' },
    { id: 'FNT', code: 'FNT', nameEn: 'Fountains',          nameAr: 'نوافير' },
  ],
  LND: [
    { id: 'PLT', code: 'PLT', nameEn: 'Plants',             nameAr: 'نباتات' },
    { id: 'TRE', code: 'TRE', nameEn: 'Trees',              nameAr: 'أشجار' },
    { id: 'POT', code: 'POT', nameEn: 'Pots & Planters',    nameAr: 'أصص' },
  ],
  SAN: [
    { id: 'WC',  code: 'WC',  nameEn: 'WC & Bidets',        nameAr: 'مراحيض ومحدات' },
    { id: 'BSN', code: 'BSN', nameEn: 'Basins',             nameAr: 'أحواض' },
    { id: 'TAP', code: 'TAP', nameEn: 'Taps & Mixers',      nameAr: 'حنفيات وخلاطات' },
  ],
  ELC: [
    { id: 'SWT', code: 'SWT', nameEn: 'Switches & Sockets', nameAr: 'مفاتيح ومخارج' },
    { id: 'PNL', code: 'PNL', nameEn: 'Panels',             nameAr: 'لوحات' },
    { id: 'CBL', code: 'CBL', nameEn: 'Cable Management',   nameAr: 'إدارة الكابلات' },
  ],
  MCH: [
    { id: 'AHU', code: 'AHU', nameEn: 'Air Handling',       nameAr: 'وحدات هواء' },
    { id: 'FCU', code: 'FCU', nameEn: 'Fan Coil Units',     nameAr: 'وحدات فان كويل' },
    { id: 'GRL', code: 'GRL', nameEn: 'Grilles & Diffusers',nameAr: 'شبكات ومنافذ' },
  ],
  ARC: [
    { id: 'COL', code: 'COL', nameEn: 'Columns',            nameAr: 'أعمدة' },
    { id: 'RLG', code: 'RLG', nameEn: 'Railings',           nameAr: 'درابزين' },
    { id: 'STA', code: 'STA', nameEn: 'Stairs',             nameAr: 'درج' },
  ],
  STR: [
    { id: 'BEA', code: 'BEA', nameEn: 'Beams',              nameAr: 'عوارض' },
    { id: 'SLB', code: 'SLB', nameEn: 'Slabs',              nameAr: 'بلاطات' },
    { id: 'FND', code: 'FND', nameEn: 'Foundation',         nameAr: 'أساسات' },
  ],
};

// Spec templates by category
export const CATEGORY_SPECS = {
  FUR: ['Width','Height','Depth','Weight','Color','Finish','Material','Warranty'],
  LGT: ['Wattage (W)','Lumens','Color Temperature (K)','IP Rating','Voltage (V)','Dimensions'],
  KIT: ['Width','Height','Depth','Material','Finish','Fire Rating'],
  BTH: ['Width','Height','Depth','Material','Finish','IP Rating'],
  DOR: ['Width','Height','Thickness','Material','Finish','Fire Rating','Acoustic Rating (dB)'],
  WIN: ['Width','Height','Frame Material','Glazing Type','U-Value','Acoustic Rating (dB)'],
  FLR: ['Width','Length','Thickness','Material','Finish','Slip Resistance (R-rating)'],
  WAL: ['Coverage (m²/L)','Finish','Color','Fire Rating'],
  CEL: ['Width','Length','Thickness','Fire Rating','Acoustic Rating (NRC)'],
  DEC: ['Width','Height','Depth','Material','Color','Finish'],
  OFF: ['Width','Height','Depth','Weight Capacity','Material','Color'],
  OUT: ['Width','Height','Depth','Material','Weather Rating','UV Resistance'],
  LND: ['Height','Spread','Season','Water Requirement'],
  SAN: ['Width','Height','Depth','Material','Finish','Water Consumption (L/flush)'],
  ELC: ['Voltage (V)','Amperage (A)','IP Rating','Color','Mounting Type'],
  MCH: ['Capacity (kW)','Airflow (m³/h)','Dimensions','Noise Level (dB)'],
  ARC: ['Width','Height','Length','Material','Finish','Load Capacity'],
  STR: ['Width','Height','Length','Material','Grade','Load Capacity (kN)'],
};

export const UNITS = [
  { id: 'PC',  labelEn: 'Piece',        labelAr: 'قطعة' },
  { id: 'SET', labelEn: 'Set',          labelAr: 'طقم' },
  { id: 'M',   labelEn: 'Meter',        labelAr: 'متر' },
  { id: 'M2',  labelEn: 'Square Meter', labelAr: 'متر مربع' },
  { id: 'M3',  labelEn: 'Cubic Meter',  labelAr: 'متر مكعب' },
  { id: 'KG',  labelEn: 'Kilogram',     labelAr: 'كيلوجرام' },
  { id: 'L',   labelEn: 'Liter',        labelAr: 'لتر' },
  { id: 'RL',  labelEn: 'Roll',         labelAr: 'لفة' },
  { id: 'BOX', labelEn: 'Box',          labelAr: 'صندوق' },
];

export const FILE_FORMATS = ['RFA','RVT','MAX','FBX','OBJ','SKP','DWG','IFC','PDF','ZIP'];
export const SOFTWARE_LIST = ['Autodesk Revit','3ds Max','SketchUp','Blender','AutoCAD','ArchiCAD','Vectorworks'];

export const LICENSE_TYPES = [
  'CC BY 4.0','CC BY-SA 4.0','CC BY-NC 4.0','CC0 (Public Domain)',
  'Royalty Free','Commercial License','Proprietary','Custom',
];

export const MATERIAL_TYPES = [
  'Wood','Metal','Fabric','Leather','Glass','Stone','Marble',
  'Ceramic','Plastic','Foam','Concrete','Composite','Other',
];
