import { getProduct3DAsset } from '../data/product3dAssets.js';

export function productImage(product) {
  return getProduct3DAsset(product)?.imageUrl || product?.signed_image_url || null;
}
