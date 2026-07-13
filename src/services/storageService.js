import { supabase, SUPABASE_CONFIGURED } from '../lib/supabase';

const BUCKETS = {
  IMAGES: 'product-images',
  FILES: 'product-files',
  DOCS: 'supplier-documents',
  PROOFS: 'ownership-proofs',
};

function buildPath(userId, fileName) {
  const ext = fileName.split('.').pop();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  return `${userId}/${name}`;
}

export const storageService = {
  async uploadProductImage(userId, file) {
    if (!SUPABASE_CONFIGURED) {
      return { path: null, url: URL.createObjectURL(file) };
    }
    const path = buildPath(userId, file.name);
    const { error } = await supabase.storage
      .from(BUCKETS.IMAGES)
      .upload(path, file, { upsert: false });
    if (error) throw error;
    const { data } = supabase.storage.from(BUCKETS.IMAGES).getPublicUrl(path);
    return { path, url: data.publicUrl };
  },

  async uploadProductFile(userId, file) {
    if (!SUPABASE_CONFIGURED) {
      return { path: null, name: file.name, size: file.size };
    }
    const path = buildPath(userId, file.name);
    const { error } = await supabase.storage
      .from(BUCKETS.FILES)
      .upload(path, file, { upsert: false });
    if (error) throw error;
    return { path, name: file.name, size: file.size };
  },

  async createSignedDownloadUrl(bucket, path, expiresInSeconds = 3600) {
    if (!SUPABASE_CONFIGURED) throw new Error('Supabase not configured');
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresInSeconds);
    if (error) throw error;
    return data.signedUrl;
  },

  async deleteFile(bucket, path) {
    if (!SUPABASE_CONFIGURED) return;
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  },

  getPublicUrl(path) {
    if (!SUPABASE_CONFIGURED || !path) return null;
    const { data } = supabase.storage.from(BUCKETS.IMAGES).getPublicUrl(path);
    return data.publicUrl;
  },

  BUCKETS,
};
