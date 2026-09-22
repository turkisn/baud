revoke insert, update, delete, truncate, references, trigger
on table public.products,
         public.product_images,
         public.product_specifications,
         public.suppliers,
         public.categories,
         public.subcategories,
         public.manufacturers,
         public.usage_events
from anon;
