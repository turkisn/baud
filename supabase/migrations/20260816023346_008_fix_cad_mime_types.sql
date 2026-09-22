UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'application/octet-stream','application/zip','application/pdf','model/vnd.3mf','model/obj','application/x-fbx','application/x-koan','application/acad','application/x-autocad','image/vnd.dwg','application/x-3ds','image/x-3ds'
]
WHERE id = 'product-files';
