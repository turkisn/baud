-- ============================================================
-- BUAD Platform — Complete Database Schema
-- Run this in Supabase SQL Editor after connecting your project
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- SEQUENCES — for BUOD Reference Numbers (never recycled)
-- ============================================================
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_FUR_SOF START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_FUR_CHR START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_FUR_TBL START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_FUR_BED START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_FUR_STG START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_LGT_PEN START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_LGT_CEL START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_LGT_WLL START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_LGT_FLR START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_KIT_CAB START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_KIT_CNT START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_BTH_SAN START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_BTH_VNT START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_DOR_WOD START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_DOR_MTL START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_WIN_FRM START 1;
CREATE SEQUENCE IF NOT EXISTS buod_ref_seq_GEN_GEN START 1;

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR(6)  NOT NULL UNIQUE,   -- FUR, LGT, KIT …
  name_ar     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  icon        VARCHAR(10),
  sort_order  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: subcategories
-- ============================================================
CREATE TABLE IF NOT EXISTS subcategories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  code        VARCHAR(6)  NOT NULL,           -- SOF, CHR, TBL …
  name_ar     VARCHAR(100) NOT NULL,
  name_en     VARCHAR(100) NOT NULL,
  is_active   BOOLEAN DEFAULT TRUE,
  sort_order  INT DEFAULT 0,
  UNIQUE(category_id, code)
);

-- ============================================================
-- TABLE: suppliers
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name_ar     VARCHAR(200) NOT NULL,
  company_name_en     VARCHAR(200) NOT NULL,
  commercial_name     VARCHAR(200),
  country             VARCHAR(100),
  city                VARCHAR(100),
  website             TEXT,
  email               VARCHAR(200),
  phone               VARCHAR(50),
  logo                TEXT,
  verification_status VARCHAR(30) DEFAULT 'unverified'
                      CHECK (verification_status IN ('unverified','pending','verified')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: manufacturers
-- ============================================================
CREATE TABLE IF NOT EXISTS manufacturers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name_ar     VARCHAR(200) NOT NULL,
  company_name_en     VARCHAR(200) NOT NULL,
  commercial_name     VARCHAR(200),
  country             VARCHAR(100),
  city                VARCHAR(100),
  website             TEXT,
  email               VARCHAR(200),
  phone               VARCHAR(50),
  logo                TEXT,
  verification_status VARCHAR(30) DEFAULT 'unverified'
                      CHECK (verification_status IN ('unverified','pending','verified')),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: products  (core table)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buod_reference          VARCHAR(30) NOT NULL UNIQUE,  -- BUOD-FUR-SOF-000001
  product_name_ar         VARCHAR(300) NOT NULL,
  product_name_en         VARCHAR(300) NOT NULL,
  short_description_ar    TEXT,
  short_description_en    TEXT,
  full_description_ar     TEXT,
  full_description_en     TEXT,
  category_id             UUID REFERENCES categories(id),
  subcategory_id          UUID REFERENCES subcategories(id),
  product_type            VARCHAR(100),
  manufacturer_id         UUID REFERENCES manufacturers(id),
  supplier_id             UUID REFERENCES suppliers(id),
  brand_name              VARCHAR(200),
  model_number            VARCHAR(100),
  manufacturer_product_code VARCHAR(100),
  country_of_origin       VARCHAR(100),
  -- Status
  status                  VARCHAR(30) NOT NULL DEFAULT 'draft'
                          CHECK (status IN ('draft','pending_review','approved','rejected','archived')),
  verification_status     VARCHAR(30) DEFAULT 'unverified'
                          CHECK (verification_status IN ('unverified','verified','manufacturer_verified','supplier_verified')),
  visibility              VARCHAR(20) DEFAULT 'private'
                          CHECK (visibility IN ('private','public','unlisted')),
  rejection_reason        TEXT,
  admin_notes             TEXT,
  -- Pricing
  is_free                 BOOLEAN DEFAULT TRUE,
  price                   DECIMAL(12,2),
  currency                VARCHAR(10) DEFAULT 'SAR',
  lead_time               VARCHAR(100),
  min_order_qty           INT DEFAULT 1,
  in_stock                BOOLEAN DEFAULT TRUE,
  regions                 JSONB DEFAULT '[]',
  -- License
  license_type            VARCHAR(100),
  license_commercial      BOOLEAN DEFAULT FALSE,
  license_download        BOOLEAN DEFAULT TRUE,
  license_modify          BOOLEAN DEFAULT FALSE,
  license_redistribute    BOOLEAN DEFAULT FALSE,
  source_url              TEXT,
  rights_confirmed        BOOLEAN DEFAULT FALSE,
  -- Unit
  unit                    VARCHAR(50),
  -- Featured image
  featured_image          TEXT,
  -- Metadata
  created_by              UUID,              -- auth.users.id
  approved_by             UUID,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  approved_at             TIMESTAMPTZ,
  version_number          INT DEFAULT 1,
  -- Stats
  view_count              INT DEFAULT 0,
  download_count          INT DEFAULT 0
);

CREATE INDEX idx_products_status       ON products(status);
CREATE INDEX idx_products_category     ON products(category_id);
CREATE INDEX idx_products_buod_ref     ON products(buod_reference);
CREATE INDEX idx_products_created_by   ON products(created_by);

-- ============================================================
-- TABLE: product_specifications
-- ============================================================
CREATE TABLE IF NOT EXISTS product_specifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  specification_name_ar VARCHAR(200),
  specification_name_en VARCHAR(200),
  specification_code    VARCHAR(50),
  value                 TEXT,
  unit                  VARCHAR(50),
  data_type             VARCHAR(20) DEFAULT 'text'
                        CHECK (data_type IN ('text','number','boolean','select')),
  sort_order            INT DEFAULT 0
);

-- ============================================================
-- TABLE: product_materials
-- ============================================================
CREATE TABLE IF NOT EXISTS product_materials (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  material_name_ar      VARCHAR(200),
  material_name_en      VARCHAR(200),
  material_code         VARCHAR(50),
  material_type         VARCHAR(100),
  finish                VARCHAR(100),
  color                 VARCHAR(100),
  quantity_per_product  DECIMAL(10,4),
  unit                  VARCHAR(50),
  waste_percentage      DECIMAL(5,2) DEFAULT 0,
  supplier_id           UUID REFERENCES suppliers(id),
  unit_cost             DECIMAL(12,2),
  currency              VARCHAR(10) DEFAULT 'SAR',
  notes                 TEXT
);

-- ============================================================
-- TABLE: product_components
-- ============================================================
CREATE TABLE IF NOT EXISTS product_components (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  component_name_ar     VARCHAR(200),
  component_name_en     VARCHAR(200),
  component_code        VARCHAR(50),
  quantity              DECIMAL(10,4),
  unit                  VARCHAR(50),
  linked_product_id     UUID REFERENCES products(id),
  notes                 TEXT
);

-- ============================================================
-- TABLE: product_files
-- ============================================================
CREATE TABLE IF NOT EXISTS product_files (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id       UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  file_type        VARCHAR(30),               -- block, document, cad, render
  software_name    VARCHAR(100),
  software_version VARCHAR(50),
  file_format      VARCHAR(10)
                   CHECK (file_format IN ('RFA','RVT','MAX','FBX','OBJ','SKP','DWG','IFC','PDF','ZIP','OTHER')),
  file_name_original VARCHAR(300),            -- original name from user
  file_name_stored   VARCHAR(300),            -- UUID-based safe name
  file_path        TEXT,                      -- Supabase Storage path
  file_size        BIGINT,                    -- bytes
  is_primary       BOOLEAN DEFAULT FALSE,
  download_count   INT DEFAULT 0,
  uploaded_by      UUID,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: product_images
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_path     TEXT NOT NULL,
  image_type     VARCHAR(30) DEFAULT 'render'
                 CHECK (image_type IN ('render','dimension','material','catalogue','lifestyle','other')),
  alt_text_ar    VARCHAR(300),
  alt_text_en    VARCHAR(300),
  sort_order     INT DEFAULT 0,
  is_primary     BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: product_revisions
-- ============================================================
CREATE TABLE IF NOT EXISTS product_revisions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id      UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version_number  INT NOT NULL,
  changed_by      UUID,
  change_summary  TEXT,
  previous_data   JSONB,
  new_data        JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: project_product_instances  (for future BOQ engine)
-- ============================================================
CREATE TABLE IF NOT EXISTS project_product_instances (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id            UUID,
  buod_reference        VARCHAR(30) NOT NULL,
  product_id            UUID REFERENCES products(id),
  source_element_id     VARCHAR(200),           -- Revit ElementId
  source_software       VARCHAR(50),            -- Revit, ArchiCAD …
  source_file_name      VARCHAR(300),
  quantity              DECIMAL(12,4) DEFAULT 1,
  level_name            VARCHAR(100),
  room_name             VARCHAR(100),
  extracted_parameters  JSONB DEFAULT '{}',     -- raw Revit parameters
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_instances_buod ON project_product_instances(buod_reference);
CREATE INDEX idx_instances_project ON project_product_instances(project_id);

-- ============================================================
-- SEED: categories
-- ============================================================
INSERT INTO categories (code, name_ar, name_en, icon, sort_order) VALUES
  ('FUR','أثاث','Furniture','🛋️',1),
  ('LGT','إضاءة','Lighting','💡',2),
  ('KIT','مطبخ','Kitchen','🍳',3),
  ('BTH','حمامات','Bathroom','🚿',4),
  ('DOR','أبواب','Doors','🚪',5),
  ('WIN','نوافذ','Windows','🪟',6),
  ('FLR','أرضيات','Flooring','◼️',7),
  ('WAL','تشطيبات جدران','Wall Finishes','🧱',8),
  ('CEL','أسقف','Ceiling','⬜',9),
  ('DEC','ديكور','Decoration','🎨',10),
  ('OFF','مكتبي','Office','🖥️',11),
  ('OUT','خارجي','Outdoor','🌿',12),
  ('LND','تنسيق موقع','Landscape','🌳',13),
  ('SAN','صحي','Sanitary','🚰',14),
  ('ELC','كهرباء','Electrical','⚡',15),
  ('MCH','ميكانيكا','Mechanical','⚙️',16),
  ('ARC','معماري','Architectural','🏛️',17),
  ('STR','إنشائي','Structural','🏗️',18)
ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- ROW LEVEL SECURITY (enable after connecting auth)
-- ============================================================
ALTER TABLE products            ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_files       ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images      ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_materials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_components  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_specifications ENABLE ROW LEVEL SECURITY;

-- Public can see approved products
CREATE POLICY "public_see_approved" ON products
  FOR SELECT USING (status = 'approved' AND visibility = 'public');

-- Owner can see own products
CREATE POLICY "owner_see_own" ON products
  FOR SELECT USING (auth.uid() = created_by);

-- Owner can insert
CREATE POLICY "owner_insert" ON products
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Owner can update own drafts
CREATE POLICY "owner_update_draft" ON products
  FOR UPDATE USING (auth.uid() = created_by AND status IN ('draft','rejected'));

-- ============================================================
-- STORAGE BUCKETS (run in Supabase Dashboard → Storage)
-- ============================================================
-- bucket: product-images   (public)
-- bucket: product-files    (private, signed URLs only)
-- bucket: product-docs     (private, license/certification files)
-- Max file size: 100 MB for files, 20 MB for images
