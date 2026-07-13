-- ============================================================
-- BUAD Platform — Migration 001: Initial Schema
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     TEXT,
  email         TEXT,
  avatar_url    TEXT,
  phone         TEXT,
  company_name  TEXT,
  role          TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user','designer','supplier','manufacturer','reviewer','admin','super_admin')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── categories ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code         VARCHAR(6)   NOT NULL UNIQUE,
  name_ar      VARCHAR(100) NOT NULL,
  name_en      VARCHAR(100) NOT NULL,
  description_ar TEXT,
  description_en TEXT,
  icon         VARCHAR(10),
  sort_order   INT DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── subcategories ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subcategories (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id  UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  code         VARCHAR(6)   NOT NULL,
  name_ar      VARCHAR(100) NOT NULL,
  name_en      VARCHAR(100) NOT NULL,
  sort_order   INT DEFAULT 0,
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, code)
);

-- ── suppliers ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.suppliers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID REFERENCES auth.users(id),
  company_name_ar     VARCHAR(200) NOT NULL,
  company_name_en     VARCHAR(200) NOT NULL,
  commercial_name     VARCHAR(200),
  country             VARCHAR(100),
  city                VARCHAR(100),
  email               VARCHAR(200),
  phone               VARCHAR(50),
  website             TEXT,
  logo_path           TEXT,
  verification_status VARCHAR(30) DEFAULT 'unverified'
                      CHECK (verification_status IN ('unverified','pending','verified')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── manufacturers ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.manufacturers (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id            UUID REFERENCES auth.users(id),
  company_name_ar     VARCHAR(200) NOT NULL,
  company_name_en     VARCHAR(200) NOT NULL,
  commercial_name     VARCHAR(200),
  country             VARCHAR(100),
  city                VARCHAR(100),
  email               VARCHAR(200),
  phone               VARCHAR(50),
  website             TEXT,
  logo_path           TEXT,
  verification_status VARCHAR(30) DEFAULT 'unverified'
                      CHECK (verification_status IN ('unverified','pending','verified')),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── buod_reference_counters ──────────────────────────────────
-- Atomic counter per category-subcategory pair (race-condition safe)
CREATE TABLE IF NOT EXISTS public.buod_reference_counters (
  category_code    VARCHAR(6) NOT NULL,
  subcategory_code VARCHAR(6) NOT NULL,
  last_number      BIGINT     NOT NULL DEFAULT 0,
  PRIMARY KEY (category_code, subcategory_code)
);

-- ── products ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buod_reference           VARCHAR(30) UNIQUE,
  product_name_ar          VARCHAR(300) NOT NULL,
  product_name_en          VARCHAR(300) NOT NULL,
  short_description_ar     TEXT,
  short_description_en     TEXT,
  full_description_ar      TEXT,
  full_description_en      TEXT,
  category_id              UUID REFERENCES public.categories(id),
  subcategory_id           UUID REFERENCES public.subcategories(id),
  product_type             VARCHAR(100),
  supplier_id              UUID REFERENCES public.suppliers(id),
  manufacturer_id          UUID REFERENCES public.manufacturers(id),
  brand_name               VARCHAR(200),
  model_number             VARCHAR(100),
  manufacturer_product_code VARCHAR(100),
  country_of_origin        VARCHAR(100),
  unit                     VARCHAR(50),
  status                   VARCHAR(30) NOT NULL DEFAULT 'draft'
                           CHECK (status IN ('draft','pending_review','approved','rejected','archived')),
  verification_status      VARCHAR(30) DEFAULT 'unverified'
                           CHECK (verification_status IN ('unverified','verified','manufacturer_verified','supplier_verified')),
  visibility               VARCHAR(20) DEFAULT 'private'
                           CHECK (visibility IN ('private','public','unlisted')),
  rejection_reason         TEXT,
  admin_notes              TEXT,
  is_free                  BOOLEAN DEFAULT TRUE,
  price                    DECIMAL(12,2),
  currency                 VARCHAR(10) DEFAULT 'SAR',
  lead_time                VARCHAR(100),
  min_order_qty            INT DEFAULT 1,
  in_stock                 BOOLEAN DEFAULT TRUE,
  license_type             VARCHAR(100),
  license_commercial       BOOLEAN DEFAULT FALSE,
  license_download         BOOLEAN DEFAULT TRUE,
  license_modify           BOOLEAN DEFAULT FALSE,
  license_redistribute     BOOLEAN DEFAULT FALSE,
  source_url               TEXT,
  rights_confirmed         BOOLEAN DEFAULT FALSE,
  featured_image_path      TEXT,
  created_by               UUID REFERENCES auth.users(id),
  approved_by              UUID REFERENCES auth.users(id),
  approved_at              TIMESTAMPTZ,
  version_number           INT DEFAULT 1,
  view_count               INT DEFAULT 0,
  download_count           INT DEFAULT 0,
  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_status      ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_visibility  ON public.products(visibility);
CREATE INDEX IF NOT EXISTS idx_products_category    ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_created_by  ON public.products(created_by);
CREATE INDEX IF NOT EXISTS idx_products_buod_ref    ON public.products(buod_reference);

-- ── product_images ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_images (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_path  TEXT NOT NULL,
  image_type  VARCHAR(30) DEFAULT 'render'
              CHECK (image_type IN ('render','dimension','material','catalogue','lifestyle','other')),
  alt_text_ar VARCHAR(300),
  alt_text_en VARCHAR(300),
  sort_order  INT DEFAULT 0,
  is_primary  BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── product_files ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_files (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id         UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  file_type          VARCHAR(30) DEFAULT 'block',
  software_name      VARCHAR(100),
  software_version   VARCHAR(50),
  file_format        VARCHAR(10)
                     CHECK (file_format IN ('RFA','RVT','MAX','FBX','OBJ','SKP','DWG','IFC','PDF','ZIP','OTHER')),
  original_file_name VARCHAR(300),
  stored_file_name   VARCHAR(300),
  file_path          TEXT,
  file_size          BIGINT,
  mime_type          VARCHAR(100),
  is_primary         BOOLEAN DEFAULT FALSE,
  download_count     INT DEFAULT 0,
  uploaded_by        UUID REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ── product_specifications ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_specifications (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id            UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  specification_name_ar VARCHAR(200),
  specification_name_en VARCHAR(200),
  specification_code    VARCHAR(50),
  value                 TEXT,
  unit                  VARCHAR(50),
  data_type             VARCHAR(20) DEFAULT 'text',
  sort_order            INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── product_materials ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_materials (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id           UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_name_ar     VARCHAR(200),
  material_name_en     VARCHAR(200),
  material_code        VARCHAR(50),
  material_type        VARCHAR(100),
  finish               VARCHAR(100),
  color                VARCHAR(100),
  quantity_per_product DECIMAL(10,4),
  unit                 VARCHAR(50),
  waste_percentage     DECIMAL(5,2) DEFAULT 0,
  supplier_id          UUID REFERENCES public.suppliers(id),
  unit_cost            DECIMAL(12,2),
  notes                TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- ── product_components ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_components (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id          UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  component_name_ar   VARCHAR(200),
  component_name_en   VARCHAR(200),
  component_code      VARCHAR(50),
  quantity            DECIMAL(10,4),
  unit                VARCHAR(50),
  linked_product_id   UUID REFERENCES public.products(id),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── product_revisions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_revisions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  changed_by     UUID REFERENCES auth.users(id),
  change_summary TEXT,
  previous_data  JSONB,
  new_data       JSONB,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── product_review_actions ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.product_review_actions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id  UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES auth.users(id),
  action      VARCHAR(30) NOT NULL
              CHECK (action IN ('submitted','approved','rejected','revision_requested','archived')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── project_product_instances (future BOQ) ────────────────────
CREATE TABLE IF NOT EXISTS public.project_product_instances (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id           UUID,
  buod_reference       VARCHAR(30) NOT NULL,
  product_id           UUID REFERENCES public.products(id),
  source_element_id    VARCHAR(200),
  source_software      VARCHAR(50),
  source_file_name     VARCHAR(300),
  quantity             DECIMAL(12,4) DEFAULT 1,
  level_name           VARCHAR(100),
  room_name            VARCHAR(100),
  extracted_parameters JSONB DEFAULT '{}',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_instances_buod    ON public.project_product_instances(buod_reference);
CREATE INDEX IF NOT EXISTS idx_instances_project ON public.project_product_instances(project_id);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── Auto-create profile after signup ─────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
