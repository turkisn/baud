// Curated, self-contained previews derived from licensed source files.
// Never use a product-provided URL here: assets are reviewed and pinned at build time.
export const WALL_M_PREVIEW = Object.freeze({
  productId: 'ed04b350-a567-4477-b763-0d4cc63e94d1',
  slug: 'open-bim-skylark250-wall-m',
  url: '/open-bim/skylark250/WALL-M.glb',
  bytes: 491716,
  sha256: '26202dc48cf59951b19959ea574a28831ca6b8ebdb7a3a248a26b48bbcc28fc7',
  attributionUrl: '/open-bim/skylark250/ATTRIBUTION.txt',
  sourceUrl: 'https://github.com/wikihouseproject/Skylark/tree/4b5616d33004565e0264c64b5561441f43e01dc3',
  licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  camera: Object.freeze({ yaw: .65, pitch: -.25 }),
});

export function getProduct3DAsset(product) {
  return product?.id === WALL_M_PREVIEW.productId && product?.slug === WALL_M_PREVIEW.slug
    ? WALL_M_PREVIEW : null;
}

export function isCurated3DAsset(asset) {
  return asset === WALL_M_PREVIEW;
}
