const box = (position, size, color, options = {}) => ({ kind: 'box', position, size, color, ...options });
const cylinder = (position, radius, height, color, options = {}) => ({ kind: 'cylinder', position, radius, height, color, ...options });
const mesh = (vertices, faces, options = {}) => ({ kind: 'mesh', vertices, faces, ...options });

const repeat = (count, factory) => Array.from({ length: count }, (_, index) => factory(index));

const models = {
  'catalog-basalt-reception-counter': {
    camera: { pitch: -0.22, yaw: 0.55, zoom: 1.02 },
    parts: [
      mesh(
        [[-1.7, 0, -.48], [1.7, 0, -.48], [1.55, 1.34, -.48], [-1.34, 1.34, -.48], [-1.7, 0, .48], [1.7, 0, .48], [1.55, 1.34, .48], [-1.34, 1.34, .48]],
        [
          { indices: [0, 1, 2, 3], color: '#171614' }, { indices: [4, 7, 6, 5], color: '#292827' },
          { indices: [0, 4, 5, 1], color: '#11100f' }, { indices: [3, 2, 6, 7], color: '#3e3a34' },
          { indices: [1, 5, 6, 2], color: '#1d1b19' }, { indices: [0, 3, 7, 4], color: '#34312e' },
        ]
      ),
      mesh(
        [[-1.68, .02, .491], [1.68, .02, .491], [1.53, 1.32, .491], [-1.32, 1.32, .491], [-.15, .58, .496], [.72, .92, .496]],
        [
          { indices: [0, 1, 4], color: '#191817' }, { indices: [1, 5, 4], color: '#3f403f' },
          { indices: [1, 2, 5], color: '#232221' }, { indices: [2, 3, 5], color: '#494a49' },
          { indices: [3, 4, 5], color: '#292a29' }, { indices: [3, 0, 4], color: '#363735' },
        ],
        { emissive: .03 }
      ),
      box([.08, 1.41, -.02], [3.08, .16, 1.02], '#3e3933', { rotation: [0, 0, -.035] }),
      box([.02, .08, .5], [2.9, .045, .025], '#e0ad4d', { emissive: .78 }),
      box([0, -.03, 0], [4.35, .035, 2.05], '#171512'),
    ],
  },
  'catalog-rammed-earth-acoustic-module': {
    camera: { pitch: -.08, yaw: .42, zoom: .96 },
    parts: [
      box([0, 1.47, 0], [3.42, 2.94, .3], '#9a673d'),
      ...repeat(12, (index) => box([0, .17 + index * .24, .165], [3.32, .028, .025], index % 3 === 0 ? '#d09a62' : '#754829')),
      ...repeat(4, (band) => box([0, .57 + band * .68, .181], [3.28, .29, .025], '#765034')),
      ...repeat(96, (index) => {
        const band = Math.floor(index / 24);
        const column = index % 24;
        return cylinder([-1.5 + column * .13, .5 + band * .68 + (column % 2) * .11, .203], .024, .045, '#2e2118', { rotation: [Math.PI / 2, 0, 0], segments: 8 });
      }),
      box([0, -.03, 0], [4.1, .04, 1.28], '#191511'),
    ],
  },
  'catalog-stainless-shower-channel': {
    camera: { pitch: -.65, yaw: .46, zoom: .98 },
    parts: [
      box([0, .015, 0], [4.6, .03, 3.15], '#242522'),
      ...repeat(6, (index) => box([-1.72 + (index % 3) * 1.72, .05, -.77 + Math.floor(index / 3) * 1.56], [1.66, .08, 1.5], index % 2 ? '#353734' : '#2d2f2d')),
      box([0, .115, 0], [4.08, .15, .66], '#717778'),
      box([0, .205, 0], [3.78, .05, .46], '#202425'),
      ...repeat(20, (index) => box([-1.72 + index * .181, .242, 0], [.085, .028, .34], '#bfc5c5')),
      ...repeat(10, (index) => box([-2.0 + index * .44, .092, .5 + (index % 2) * .42], [.28, .018, .025], '#8ec2c5', { alpha: .5, emissive: .1, rotation: [0, (index % 3 - 1) * .18, 0] })),
    ],
  },
  'catalog-bronze-security-screen': {
    camera: { pitch: -.08, yaw: .42, zoom: .86 },
    parts: [
      box([0, 1.66, -.1], [2.86, 3.16, .1], '#21170f'),
      ...repeat(11, (index) => box([-1.08 + index * .216, 1.66, .015], [.032, 2.72, .05], index % 2 ? '#8b572b' : '#bd8040', { rotation: [0, 0, .76] })),
      ...repeat(11, (index) => box([-1.08 + index * .216, 1.66, .02], [.032, 2.72, .05], index % 2 ? '#bd8040' : '#79502a', { rotation: [0, 0, -.76] })),
      ...repeat(6, (index) => box([-.92 + index * .37, 1.66, .045], [.026, 2.82, .035], '#a16a35')),
      box([-1.49, 1.66, 0], [.18, 3.4, .24], '#8f5c2f'), box([1.49, 1.66, 0], [.18, 3.4, .24], '#8f5c2f'),
      box([0, 3.31, 0], [3.15, .18, .24], '#b57a3b'), box([0, .08, 0], [3.15, .18, .24], '#704724'),
      cylinder([1.18, 1.5, .16], .055, .34, '#d2a45a', { segments: 12 }),
      box([0, -.03, 0], [3.9, .04, 1.35], '#18140f'),
    ],
  },
  'catalog-terrazzo-seat-planter': {
    camera: { pitch: -.36, yaw: .58, zoom: .82 },
    parts: [
      box([0, .43, 0], [2.45, .78, 1.38], '#c7b08a'),
      cylinder([-1.22, .43, 0], .69, .78, '#c7b08a', { segments: 28 }), cylinder([1.22, .43, 0], .69, .78, '#c7b08a', { segments: 28 }),
      box([0, .84, 0], [1.82, .075, .72], '#3e3020'),
      cylinder([-.91, .84, 0], .36, .075, '#3e3020', { segments: 24 }), cylinder([.91, .84, 0], .36, .075, '#3e3020', { segments: 24 }),
      ...repeat(18, (index) => cylinder([-1.55 + (index % 9) * .39, .837, -.48 + Math.floor(index / 9) * .96], .025, .018, index % 3 ? '#8f7758' : '#5f5140', { segments: 7 })),
      ...repeat(5, (index) => cylinder([-.32 + index * .16, 1.42 + (index % 2) * .14, -.12 + (index % 3) * .12], .045, 1.15, '#66543a', { segments: 9, rotation: [0, 0, -.12 + index * .05] })),
      ...repeat(10, (index) => box([-.72 + (index % 5) * .36, 1.94 + Math.floor(index / 5) * .13, -.3 + (index % 2) * .55], [.48, .07, .18], index % 2 ? '#76865d' : '#929d6f', { rotation: [0, index * .47, index % 2 ? -.3 : .25] })),
      box([0, -.03, 0], [4.6, .04, 3.4], '#17140f'),
    ],
  },
  'catalog-photovoltaic-skylight': {
    camera: { pitch: -.57, yaw: .52, zoom: .92 },
    parts: [
      box([0, .08, 0], [4.5, .16, 3.25], '#ece8df'),
      box([0, .27, 0], [3.72, .22, 2.5], '#111619'),
      box([0, .42, 0], [3.42, .08, 2.2], '#1b4057'),
      ...repeat(28, (index) => box([-1.42 + (index % 7) * .475, .472, -.81 + Math.floor(index / 7) * .54], [.425, .022, .47], index % 2 ? '#286383' : '#235a79', { emissive: .05 })),
      box([-1.78, .47, 0], [.11, .12, 2.48], '#090d0f'), box([1.78, .47, 0], [.11, .12, 2.48], '#090d0f'),
      box([0, .47, -1.17], [3.65, .12, .11], '#090d0f'), box([0, .47, 1.17], [3.65, .12, .11], '#090d0f'),
      ...repeat(6, (index) => box([-1.22 + index * .49, .49, 0], [.025, .02, 2.1], '#91b9c8')),
      ...repeat(3, (index) => box([0, .495, -.53 + index * .53], [3.35, .02, .025], '#91b9c8')),
    ],
  },
  'catalog-porcelain-facade-panel': {
    camera: { pitch: -.12, yaw: -.62, zoom: .88 },
    parts: [
      box([-1.38, 1.55, -.34], [.38, 3.1, 1.05], '#343838'),
      box([-.98, 1.55, -.25], [.24, 3.02, .72], '#71736f'),
      box([-.64, 1.55, -.19], [.12, 2.94, .55], '#202323'),
      ...repeat(4, (index) => box([-.15, .43 + index * .74, -.08], [.82, .075, .34], '#777c79')),
      ...repeat(4, (index) => cylinder([.25, .43 + index * .74, .1], .07, .18, '#aeb1ac', { rotation: [0, 0, Math.PI / 2], segments: 12 })),
      box([.78, 1.55, .02], [1.42, 2.98, .16], '#ded8ca'),
      box([1.55, 1.55, .08], [.08, 2.98, .22], '#9a9388'),
      box([1.83, 1.55, .02], [.44, 2.98, .16], '#eee9df'),
      box([.79, 1.55, .13], [.028, 2.78, .022], '#b9ae99'),
      box([0, -.03, 0], [4.5, .04, 2], '#171512'),
    ],
  },
  'catalog-copper-waterfall-spout': {
    camera: { pitch: -.2, yaw: .6, zoom: .96 },
    parts: [
      box([0, 1.58, -.68], [3.65, 3.15, .18], '#6d5540'),
      ...repeat(10, (index) => cylinder([-1.5 + (index % 5) * .74, .36 + Math.floor(index / 5) * 1.75, -.565], .035, .04, '#32251d', { rotation: [Math.PI / 2, 0, 0], segments: 8 })),
      box([0, 1.78, -.42], [1.52, .44, .56], '#a85c2d'),
      box([0, 1.95, -.35], [1.36, .18, .64], '#c67b3e'),
      box([0, 1.47, -.04], [1.45, .16, .72], '#7e401f'),
      box([0, 1.38, .34], [1.34, .09, .22], '#d08a4b'),
      box([0, .91, .45], [1.3, .86, .035], '#88c8cc', { alpha: .46, emissive: .26 }),
      ...repeat(7, (index) => box([-.56 + index * .185, .91, .47], [.045, .83, .018], '#d9f1e5', { alpha: .4 })),
      cylinder([0, .18, .38], 1.12, .25, '#d8cebc', { segments: 28 }),
      cylinder([0, .32, .38], .88, .08, '#3c3026', { segments: 28 }),
      box([0, -.03, 0], [3.9, .04, 2.5], '#17130f'),
    ],
  },
  'catalog-raised-access-floor': {
    camera: { pitch: -.52, yaw: .68, zoom: .82 },
    parts: [
      box([0, .02, 0], [4.15, .04, 4.15], '#171819'),
      ...repeat(9, (index) => cylinder([-1.55 + (index % 3) * 1.55, .49, -1.55 + Math.floor(index / 3) * 1.55], .085, .88, '#696e70', { segments: 10 })),
      ...repeat(6, (index) => box([0, .48, -1.55 + index * .62], [3.25, .055, .065], '#454b4d')),
      box([-.82, 1.02, -.82], [1.5, .15, 1.5], '#bfc0bb'), box([.82, 1.02, -.82], [1.5, .15, 1.5], '#aaaCA8'),
      box([-.82, 1.02, .82], [1.5, .15, 1.5], '#d0cfca'),
      box([.82, 1.3, .82], [1.5, .15, 1.5], '#dad8d2', { rotation: [-.18, 0, 0] }),
      ...repeat(5, (index) => cylinder([-.55 + index * .28, .38, .7 + index * .05], .045, 1.65, index % 2 ? '#2f82ad' : '#245777', { rotation: [0, 0, Math.PI / 2], segments: 10 })),
      ...repeat(4, (index) => cylinder([.7 + index * .09, .28, -.46 + index * .3], .035, 1.25, index % 2 ? '#5aa0c4' : '#1f4661', { rotation: [Math.PI / 2, 0, 0], segments: 9 })),
    ],
  },
  'catalog-switchable-smart-glass': {
    camera: { pitch: -.1, yaw: .48, zoom: .88 },
    parts: [
      box([-.73, 1.52, 0], [1.38, 2.72, .065], '#78999a', { alpha: .23, emissive: .08 }),
      box([.73, 1.52, 0], [1.38, 2.72, .075], '#d7d8d2', { alpha: .92 }),
      box([0, 1.52, .045], [.055, 2.82, .1], '#8a8174'),
      box([-1.54, 1.5, 0], [.16, 3.08, .2], '#57534d'), box([1.54, 1.5, 0], [.16, 3.08, .2], '#57534d'),
      box([0, 3.0, 0], [3.22, .16, .2], '#6b655b'), box([0, .08, 0], [3.22, .17, .26], '#494641'),
      box([-.78, 1.0, -.16], [.45, 1.7, .08], '#6f766c', { alpha: .28 }),
      cylinder([-.74, 2.12, -.13], .3, .48, '#687a5f', { alpha: .34, segments: 14 }),
      box([0, -.03, 0], [4.2, .04, 1.65], '#17140f'),
    ],
  },
};

export const DEMO_3D_SLUGS = Object.freeze(Object.keys(models));
export const hasDemo3DModel = (slug) => Object.hasOwn(models, slug);
export const getDemo3DModel = (slug) => models[slug] || null;
