# BUAD Admin Backoffice — Status

Last updated: 2026-07-19

---

## Admin Routes

| Route | Component | Access | Status |
|-------|-----------|--------|--------|
| `/admin/dashboard` | AdminDashboard | reviewer, admin, super_admin | ✅ Live |
| `/admin/products` | ProductReview | reviewer, admin, super_admin | ✅ Live |
| `/admin/users` | AdminUsers | admin, super_admin | ✅ Live |
| `/admin/suppliers` | AdminSuppliers | admin, super_admin | ✅ Live |
| `/admin/manufacturers` | AdminManufacturers | admin, super_admin | ✅ Live |
| `/admin/categories` | AdminCategories | admin, super_admin | ✅ Live |
| `/admin/settings` | AdminSettings | admin, super_admin | ✅ Live |

---

## Role Permissions Matrix

| Role | Admin Panel | Product Review | Users | Suppliers/Manufacturers | Categories | Settings |
|------|-------------|----------------|-------|--------------------------|------------|---------|
| super_admin | ✅ Full | ✅ | ✅ All roles | ✅ + Verify | ✅ CRUD | ✅ |
| admin | ✅ | ✅ | ✅ Limited* | ✅ + Verify | ✅ CRUD | ✅ |
| reviewer | ✅ (limited) | ✅ | ❌ | ❌ | ❌ | ❌ |
| supplier | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| manufacturer | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| designer / user | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

*admin can change roles to: user, designer, supplier, manufacturer, reviewer — but NOT admin or super_admin, and cannot modify existing admin/super_admin users. Enforced at DB level by `admin_set_user_role()` RPC.

---

## Admin Services

### `src/services/adminService.js`

| Service | Methods |
|---------|---------|
| `userAdminService` | `list()`, `setRole()`, `getById()` |
| `supplierAdminService` | `list()`, `verify()`, `getProductCount()` |
| `manufacturerAdminService` | `list()`, `verify()`, `getProductCount()` |
| `categoryAdminService` | `listAll()`, `createCategory()`, `updateCategory()`, `toggleCategoryActive()`, `createSubcategory()`, `updateSubcategory()`, `toggleSubcategoryActive()` |
| `adminStatsService` | `getOverviewStats()` |
| `auditLogService` | `list()` |

### Existing Services (unchanged)

| Service | File |
|---------|------|
| `reviewService` | `src/services/reviewService.js` |
| `productService` | `src/services/productService.js` |
| `categoryService` | `src/services/categoryService.js` |
| `authService` | `src/services/authService.js` |

---

## Product Review Workflow

```
draft
  └─► pending_review (supplier submits)
        ├─► approved (admin/reviewer approves → visibility=public, BUOD ref generated)
        ├─► rejected (admin/reviewer rejects → rejection_reason stored)
        └─► revision_required (admin/reviewer requests changes → admin_notes stored)
              └─► pending_review (supplier resubmits)
```

All transitions protected by DB triggers:
- `enforce_product_column_acl` — blocks suppliers from self-approving
- `products_owner_update` RLS — suppliers can only update their own draft/rejected/revision_required products
- `products_admin_all` RLS — admin/super_admin have full access

---

## Supplier & Manufacturer Verification Flow

```
unverified (default on creation)
  └─► pending (admin marks as under review)
        └─► verified (admin confirms)
                └─► unverified (admin can revert)
```

Protected by `admin_verify_entity()` SECURITY DEFINER RPC (Migration 007).
Caller must be admin or super_admin — checked server-side.
Every verification change is logged to `admin_audit_log`.

---

## Category Management

- Categories: create, update, enable/disable (soft delete via `is_active`)
- Subcategories: create, update, enable/disable
- Hard delete is NOT supported to preserve referential integrity with products
- CRUD protected by `cats_admin_write` / `subcats_admin_write` RLS policies

---

## Audit Logs

Table: `public.admin_audit_log`

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `actor_user_id` | UUID | Who performed the action |
| `action` | TEXT | e.g. `product.approve`, `user.role_change` |
| `target_type` | TEXT | e.g. `product`, `user`, `supplier` |
| `target_id` | UUID | ID of the affected entity |
| `metadata` | JSONB | Context (no secrets) |
| `created_at` | TIMESTAMPTZ | Timestamp |

Logged actions:
- `user.role_change` — via `admin_set_user_role()` RPC
- `supplier.verification_change` — via `admin_verify_entity()` RPC
- `manufacturer.verification_change` — via `admin_verify_entity()` RPC
- `category.create`, `category.update`, `category.enable`, `category.disable`
- `subcategory.create`, `subcategory.update`, `subcategory.enable`, `subcategory.disable`

Product review actions are stored separately in `product_review_actions` table (existing).

---

## Database Migrations Created

| Migration | File | Status |
|-----------|------|--------|
| 007 | `supabase/migrations/007_admin_backoffice.sql` | ⚠️ **Needs manual run in Supabase SQL Editor** |

Migration 007 adds:
- `admin_audit_log` table with RLS (append-only)
- `admin_log_action()` SECURITY DEFINER RPC
- `admin_verify_entity()` SECURITY DEFINER RPC
- Fixed `products_reviewer_read` policy (reviewers now see all product statuses)
- New `profiles_reviewer_read` policy (reviewers can read profile data)
- Indexes on audit_log and foreign key fields

---

## Remaining Issues

None critical. Items for future improvement:
- Audit log UI page in admin panel (data exists in DB but no UI page yet)
- Supplier self-registration flow (creating supplier record after signup)
- Bulk actions in product review (approve/reject multiple at once)
- Email notifications on product status changes

---

## Manual Actions Required

1. **Run Migration 007 in Supabase SQL Editor**
   - Open: Supabase Dashboard → SQL Editor → New Query
   - Copy and run the content of: `supabase/migrations/007_admin_backoffice.sql`
   - This is required for: audit logs, reviewer policy fixes, verification RPC

2. No other manual actions required.
