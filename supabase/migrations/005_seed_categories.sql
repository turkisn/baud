-- ============================================================
-- BUAD Platform — Migration 005: Seed Categories & Subcategories
-- Run AFTER 001_initial_schema.sql
-- ============================================================

-- ── Categories ────────────────────────────────────────────────
INSERT INTO public.categories (code, name_ar, name_en, icon, sort_order) VALUES
  ('FUR','أثاث',           'Furniture',       '🛋️', 1),
  ('LGT','إضاءة',          'Lighting',        '💡', 2),
  ('KIT','مطبخ',           'Kitchen',         '🍳', 3),
  ('BTH','حمامات',         'Bathroom',        '🚿', 4),
  ('DOR','أبواب',          'Doors',           '🚪', 5),
  ('WIN','نوافذ',          'Windows',         '🪟', 6),
  ('FLR','أرضيات',         'Flooring',        '◼️', 7),
  ('WAL','تشطيبات جدران',  'Wall Finishes',   '🧱', 8),
  ('CEL','أسقف',           'Ceiling',         '⬜', 9),
  ('DEC','ديكور',          'Decoration',      '🎨',10),
  ('OFF','مكتبي',          'Office',          '🖥️',11),
  ('OUT','خارجي',          'Outdoor',         '🌿',12),
  ('LND','تنسيق موقع',     'Landscape',       '🌳',13),
  ('SAN','صحي',            'Sanitary',        '🚰',14),
  ('ELC','كهرباء',         'Electrical',      '⚡',15),
  ('MCH','ميكانيكا',       'Mechanical',      '⚙️',16),
  ('ARC','معماري',         'Architectural',   '🏛️',17),
  ('STR','إنشائي',         'Structural',      '🏗️',18)
ON CONFLICT (code) DO NOTHING;

-- ── Subcategories ─────────────────────────────────────────────
-- FUR
WITH cat AS (SELECT id FROM public.categories WHERE code='FUR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('SOF','كنب وجلسات',   'Sofas & Sectionals',1),
  ('CHR','كراسي',         'Chairs',            2),
  ('TBL','طاولات',        'Tables',            3),
  ('BED','أسرة',          'Beds',              4),
  ('STG','خزائن وأرفف',  'Storage & Shelving',5),
  ('OTH','أخرى',          'Other',             6)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

-- LGT
WITH cat AS (SELECT id FROM public.categories WHERE code='LGT')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('PEN','معلقة',   'Pendant',  1),
  ('CEL','سقفية',   'Ceiling',  2),
  ('WLL','جدارية',  'Wall',     3),
  ('FLR','أرضية',   'Floor',    4),
  ('TAB','طاولة',   'Table',    5),
  ('REC','مدفونة',  'Recessed', 6),
  ('OUT','خارجية',  'Outdoor',  7)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

-- KIT
WITH cat AS (SELECT id FROM public.categories WHERE code='KIT')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('CAB','خزائن',      'Cabinets',     1),
  ('CNT','أسطح عمل',  'Countertops',  2),
  ('SNK','أحواض',      'Sinks',        3),
  ('APL','أجهزة',      'Appliances',   4)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

-- BTH
WITH cat AS (SELECT id FROM public.categories WHERE code='BTH')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('SAN','أدوات صحية',     'Sanitary Ware', 1),
  ('VNT','وحدة مغسلة',    'Vanity',        2),
  ('SHW','دوش',            'Shower',        3),
  ('BTB','حوض استحمام',   'Bathtub',       4),
  ('ACC','إكسسوار',        'Accessories',   5)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

-- DOR
WITH cat AS (SELECT id FROM public.categories WHERE code='DOR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('WOD','خشبي',           'Wood',       1),
  ('MTL','معدني',          'Metal',      2),
  ('GLS','زجاجي',          'Glass',      3),
  ('FIR','مقاوم للحريق',  'Fire Rated', 4)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

-- WIN
WITH cat AS (SELECT id FROM public.categories WHERE code='WIN')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('FRM','مؤطر',       'Framed',   1),
  ('FRL','بدون إطار', 'Frameless',2),
  ('SKY','منور',       'Skylight', 3),
  ('CRN','زاوية',      'Corner',   4)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

-- FLR
WITH cat AS (SELECT id FROM public.categories WHERE code='FLR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES
  ('PRQ','باركيه',  'Parquet',1),
  ('TIL','بلاط',    'Tiles',  2),
  ('MRB','رخام',    'Marble', 3),
  ('CRP','سجاد',    'Carpet', 4),
  ('EXP','إيبوكسي', 'Epoxy',  5)
) AS sub(code,name_ar,name_en,sort_order)
ON CONFLICT DO NOTHING;

-- WAL, CEL, DEC, OFF, OUT, LND, SAN, ELC, MCH, ARC, STR
WITH cat AS (SELECT id FROM public.categories WHERE code='WAL')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('PNT','دهان','Paint',1),('WLP','ورق جدران','Wallpaper',2),('STN','تكسية حجر','Stone Cladding',3),('WDP','تكسية خشب','Wood Panel',4)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='CEL')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('GYP','جبس','Gypsum',1),('ACT','بلاط صوتي','Acoustic Tiles',2),('STR','سقف مشدود','Stretch Ceiling',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='DEC')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('VAS','مزهريات','Vases & Objects',1),('ART','لوحات','Art & Frames',2),('MIR','مرايا','Mirrors',3),('RUG','سجاد','Rugs',4),('CUS','وسائد','Cushions',5)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='OFF')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('DSK','مكاتب','Desks',1),('OCH','كراسي مكتبية','Office Chairs',2),('CAB','أدراج','Filing & Storage',3),('WRK','محطات عمل','Workstations',4)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='OUT')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('FUR','أثاث خارجي','Outdoor Furniture',1),('PVN','تبليط','Paving',2),('FNT','نوافير','Fountains',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='LND')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('PLT','نباتات','Plants',1),('TRE','أشجار','Trees',2),('POT','أصص','Pots & Planters',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='SAN')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('WC','مراحيض','WC & Bidets',1),('BSN','أحواض','Basins',2),('TAP','حنفيات','Taps & Mixers',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='ELC')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('SWT','مفاتيح','Switches & Sockets',1),('PNL','لوحات','Panels',2),('CBL','إدارة الكابلات','Cable Management',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='MCH')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('AHU','وحدات هواء','Air Handling',1),('FCU','فان كويل','Fan Coil Units',2),('GRL','شبكات','Grilles & Diffusers',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='ARC')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('COL','أعمدة','Columns',1),('RLG','درابزين','Railings',2),('STA','درج','Stairs',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;

WITH cat AS (SELECT id FROM public.categories WHERE code='STR')
INSERT INTO public.subcategories (category_id, code, name_ar, name_en, sort_order)
SELECT cat.id, sub.code, sub.name_ar, sub.name_en, sub.sort_order FROM cat,
(VALUES ('BEA','عوارض','Beams',1),('SLB','بلاطات','Slabs',2),('FND','أساسات','Foundation',3)) AS sub(code,name_ar,name_en,sort_order) ON CONFLICT DO NOTHING;
