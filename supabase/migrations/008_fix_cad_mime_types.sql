-- Expand product-files bucket to accept all browser-reported MIME types for
-- supported 3D/CAD formats. Browsers assign inconsistent types:
--   .skp  → application/x-koan  (SketchUp)
--   .dwg  → image/vnd.dwg | application/acad | application/x-autocad
--   .obj  → model/obj | text/plain
--   .fbx  → application/x-fbx
--   .3ds  → application/x-3ds | image/x-3ds
--   .rvt  → application/octet-stream (Revit has no IANA type)
--
-- The frontend always sends contentType: 'application/octet-stream' to avoid
-- rejections, but this migration ensures the bucket accepts every known MIME
-- as a second layer of defense.

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  -- Generic binary (always accepted — frontend forces this)
  'application/octet-stream',
  -- Archive / document types for bundled assets
  'application/zip',
  'application/pdf',
  -- Standard 3D model types
  'model/vnd.3mf',
  'model/obj',
  -- Browser-assigned types for specific CAD formats
  'application/x-fbx',          -- FBX
  'application/x-koan',         -- SketchUp .skp
  'application/acad',           -- AutoCAD .dwg (older browsers)
  'application/x-autocad',      -- AutoCAD .dwg (some browsers)
  'image/vnd.dwg',              -- AutoCAD .dwg (newer browsers)
  'application/x-3ds',          -- 3DS Max .3ds
  'image/x-3ds'                 -- 3DS Max .3ds (alternate MIME)
]
WHERE id = 'product-files';
