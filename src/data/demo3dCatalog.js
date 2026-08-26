const box = (position, size, color, options = {}) => ({ kind: 'box', position, size, color, ...options });
const cylinder = (position, radius, height, color, options = {}) => ({ kind: 'cylinder', position, radius, height, color, ...options });

const repeat = (count, factory) => Array.from({ length: count }, (_, index) => factory(index));

const models = {
  'catalog-basalt-reception-counter': {
    camera: { pitch: -0.25, yaw: 0.62, zoom: 1.05 },
    parts: [
      box([0, .58, 0], [3.4, 1.16, .82], '#28241f'),
      box([-.92, 1.2, -.05], [1.55, .18, .92], '#4b4540'),
      box([.94, 1.07, .08], [1.38, .42, .78], '#39342f'),
      box([0, .36, .425], [2.75, .08, .03], '#e3b95d', { emissive: .65 }),
      box([0, .01, 0], [3.9, .03, 1.35], '#15130f'),
    ],
  },
  'catalog-rammed-earth-acoustic-module': {
    camera: { pitch: -.12, yaw: .5, zoom: 1 },
    parts: [
      box([0, 1.25, 0], [3.25, 2.5, .22], '#8f633d'),
      ...repeat(7, (index) => box([0, .22 + index * .35, .14], [3.05, .055, .035], index % 2 ? '#c09363' : '#6e482d')),
      ...repeat(15, (index) => cylinder([-1.25 + (index % 5) * .62, .48 + Math.floor(index / 5) * .72, .145], .045, .05, '#302118', { rotation: [Math.PI / 2, 0, 0], segments: 10 })),
      box([0, .02, 0], [3.8, .04, 1.1], '#17130f'),
    ],
  },
  'catalog-stainless-shower-channel': {
    camera: { pitch: -.5, yaw: .6, zoom: 1.12 },
    parts: [
      box([0, .08, 0], [3.7, .16, .72], '#777b7c'),
      box([0, .17, 0], [3.35, .06, .46], '#222727'),
      ...repeat(15, (index) => box([-1.52 + index * .217, .215, 0], [.065, .035, .4], '#c7cccb')),
      box([0, .01, 0], [4.2, .025, 1.35], '#24221e'),
    ],
  },
  'catalog-bronze-security-screen': {
    camera: { pitch: -.08, yaw: .55, zoom: .93 },
    parts: [
      box([-1.55, 1.55, 0], [.15, 3.1, .18], '#9b6734'), box([1.55, 1.55, 0], [.15, 3.1, .18], '#9b6734'),
      box([0, 3.03, 0], [3.25, .15, .18], '#b17a3d'), box([0, .08, 0], [3.25, .15, .18], '#7b4f29'),
      ...repeat(5, (index) => box([-1.15 + index * .58, 1.55, 0], [.07, 2.8, .1], '#b77c40', { rotation: [0, 0, .62] })),
      ...repeat(5, (index) => box([-1.15 + index * .58, 1.55, -.01], [.07, 2.8, .1], '#79502d', { rotation: [0, 0, -.62] })),
      box([0, .01, 0], [3.9, .03, 1.05], '#16130f'),
    ],
  },
  'catalog-terrazzo-seat-planter': {
    camera: { pitch: -.42, yaw: .65, zoom: .9 },
    parts: [
      cylinder([0, .42, 0], 1.55, .78, '#c9b58f', { segments: 28 }),
      cylinder([0, .84, 0], .72, .12, '#3f3323', { segments: 28 }),
      ...repeat(4, (index) => cylinder([-.36 + index * .24, 1.28 + (index % 2) * .16, -.12 + (index % 3) * .15], .055, .9, '#74693a', { segments: 9 })),
      ...repeat(8, (index) => box([-.56 + (index % 4) * .37, 1.72 + Math.floor(index / 4) * .12, -.22 + (index % 2) * .38], [.45, .08, .16], '#8d9960', { rotation: [0, index * .4, (index % 2 ? -.25 : .25)] })),
      box([0, .01, 0], [4.1, .03, 3.1], '#17140f'),
    ],
  },
  'catalog-photovoltaic-skylight': {
    camera: { pitch: -.54, yaw: .58, zoom: 1.05 },
    parts: [
      box([0, .44, 0], [3.4, .16, 2.25], '#796641'),
      box([0, .54, 0], [3.12, .08, 1.96], '#18384a', { alpha: .9 }),
      ...repeat(6, (index) => box([-1.3 + index * .52, .595, 0], [.035, .018, 1.88], '#c2a45d')),
      ...repeat(4, (index) => box([0, .6, -.72 + index * .48], [3.04, .018, .025], '#c2a45d')),
      box([0, .01, 0], [4.1, .03, 3.1], '#15130f'),
    ],
  },
  'catalog-porcelain-facade-panel': {
    camera: { pitch: -.1, yaw: .5, zoom: .94 },
    parts: [
      box([0, 1.55, -.14], [3.4, 3.1, .16], '#3a3934'),
      ...repeat(6, (index) => box([index % 2 ? .82 : -.82, .53 + Math.floor(index / 2) * 1.02, 0], [1.55, .92, .12], index % 3 === 1 ? '#d3c8ae' : '#e5ddca')),
      ...repeat(4, (index) => box([-.8 + index * .54, 1.55, .075], [.018, 2.75, .015], '#aa9b7b', { rotation: [0, 0, -.42 + index * .27] })),
      box([0, .01, 0], [4, .03, 1.05], '#16130f'),
    ],
  },
  'catalog-copper-waterfall-spout': {
    camera: { pitch: -.2, yaw: .7, zoom: 1.05 },
    parts: [
      box([0, 1.32, -.45], [2.5, 2.3, .18], '#33261c'),
      box([0, 1.46, -.22], [1.65, .38, .58], '#a96331'),
      box([0, 1.18, .16], [1.5, .16, .72], '#c68045'),
      box([0, .72, .48], [1.34, .78, .025], '#6ab2b7', { alpha: .38, emissive: .25 }),
      box([0, .24, .36], [2.5, .2, 1.45], '#ded6c5'),
      box([0, .01, 0], [3.2, .03, 2.1], '#17130f'),
    ],
  },
  'catalog-raised-access-floor': {
    camera: { pitch: -.55, yaw: .62, zoom: .88 },
    parts: [
      ...repeat(9, (index) => box([-1.05 + (index % 3) * 1.05, 1.08, -1.05 + Math.floor(index / 3) * 1.05], [.96, .13, .96], index === 4 ? '#d3b66d' : '#a8aaa6')),
      ...repeat(9, (index) => cylinder([-1.05 + (index % 3) * 1.05, .54, -1.05 + Math.floor(index / 3) * 1.05], .085, .98, '#777c7d', { segments: 10 })),
      box([0, .02, 0], [3.8, .04, 3.8], '#191713'),
      box([0, .45, 0], [2.5, .025, .035], '#e2b958', { emissive: .55 }),
    ],
  },
  'catalog-switchable-smart-glass': {
    camera: { pitch: -.12, yaw: .57, zoom: .94 },
    parts: [
      box([0, 1.52, 0], [2.85, 2.75, .08], '#8bd0d6', { alpha: .28, emissive: .15 }),
      box([-1.52, 1.5, 0], [.16, 3.05, .18], '#3f4546'), box([1.52, 1.5, 0], [.16, 3.05, .18], '#3f4546'),
      box([0, 3.0, 0], [3.15, .15, .18], '#555d5e'), box([0, .08, 0], [3.15, .16, .25], '#343a3a'),
      ...repeat(5, (index) => box([-.98 + index * .49, 1.52, .07], [.018, 2.55, .012], '#c8f5ec', { alpha: .48 })),
      box([0, .01, 0], [3.8, .03, 1.25], '#16130f'),
    ],
  },
};

export const DEMO_3D_SLUGS = Object.freeze(Object.keys(models));
export const hasDemo3DModel = (slug) => Object.hasOwn(models, slug);
export const getDemo3DModel = (slug) => models[slug] || null;
