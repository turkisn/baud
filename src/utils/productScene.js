import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const surfaces = {
  stone: { roughness: .72, metalness: 0, grain: .035 },
  earth: { roughness: .95, metalness: 0, grain: .065 },
  metal: { roughness: .27, metalness: .94, grain: .006 },
  ceramic: { roughness: .32, metalness: 0, grain: .01 },
  glass: { roughness: .12, metalness: .08, grain: 0 },
  water: { roughness: .08, metalness: 0, grain: 0 },
};

function surfaceFor(slug, part) {
  if (part.surface) return surfaces[part.surface] || surfaces.stone;
  if (part.alpha < 1) return surfaces.glass;
  if (slug.includes('rammed-earth')) return surfaces.earth;
  if (slug.includes('copper') && ['#a85c2d', '#c67b3e', '#7e401f', '#d08a4b'].includes(part.color)) return surfaces.metal;
  if (slug.includes('bronze') && part.position?.[1] > .05) return surfaces.metal;
  if (slug.includes('stainless') && part.position?.[1] > .1) return surfaces.metal;
  if (slug.includes('raised-access') && part.kind === 'cylinder') return surfaces.metal;
  if (slug.includes('porcelain')) return surfaces.ceramic;
  if (slug.includes('photovoltaic') && part.position?.[1] > .35) return surfaces.glass;
  return surfaces.stone;
}

// Deterministic microtexture: no external asset requests or image downloads.
function grainTexture() {
  const size = 128;
  const pixels = new Uint8Array(size * size * 4);
  let seed = 71;
  for (let i = 0; i < pixels.length; i += 4) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const value = 100 + (seed % 120);
    pixels[i] = pixels[i + 1] = pixels[i + 2] = value;
    pixels[i + 3] = 255;
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  return texture;
}

export function buildProductScene(model, slug) {
  const group = new THREE.Group();
  const grain = grainTexture();
  const materialCache = new Map();
  const makeMaterial = (part) => {
    const surface = surfaceFor(slug, part);
    const key = JSON.stringify([part.color, part.alpha, part.emissive, surface]);
    if (materialCache.has(key)) return materialCache.get(key);
    const translucent = part.surface === 'water' || ((part.alpha ?? 1) < .5 && surface === surfaces.glass);
    const Material = translucent ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
    const material = new Material({
      color: part.color || '#b9b4a8',
      roughness: surface.roughness,
      metalness: surface.metalness,
      transparent: (part.alpha ?? 1) < 1,
      opacity: translucent ? .8 : part.alpha ?? 1,
      depthWrite: (part.alpha ?? 1) >= 1,
      side: THREE.DoubleSide,
      emissive: part.emissive ? part.color || '#e4ba64' : '#000000',
      emissiveIntensity: part.emissive || 0,
      bumpMap: surface.grain ? grain : null,
      bumpScale: surface.grain,
      ...(translucent ? { transmission: .65, thickness: .06, ior: part.surface === 'water' ? 1.333 : 1.5 } : {}),
    });
    materialCache.set(key, material);
    return material;
  };
  for (const part of model.parts) {
    let geometry;
    let material;
    if (part.kind === 'mesh') {
      const positions = [];
      const colors = [];
      for (const face of part.faces) {
        const indices = Array.isArray(face) ? face : face.indices;
        const color = new THREE.Color(face.color || part.color || '#555555');
        for (let i = 1; i < indices.length - 1; i++) {
          for (const index of [indices[0], indices[i], indices[i + 1]]) {
            positions.push(...part.vertices[index]);
            colors.push(color.r, color.g, color.b);
          }
        }
      }
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      geometry.computeVertexNormals();
      material = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .68, side: THREE.DoubleSide });
    } else {
      geometry = part.bowl
        ? new THREE.LatheGeometry([
          new THREE.Vector2(0, -part.height / 2),
          new THREE.Vector2(part.radius * .78, -part.height / 2),
          new THREE.Vector2(part.radius * .93, -part.height * .32),
          new THREE.Vector2(part.radius, part.height * .35),
          new THREE.Vector2(part.radius * .98, part.height / 2),
          new THREE.Vector2(part.radius * .89, part.height / 2),
          new THREE.Vector2(part.radius * .8, -part.height * .2),
          new THREE.Vector2(0, -part.height * .24),
        ], 64)
        : part.kind === 'cylinder'
        ? new THREE.CylinderGeometry(part.radius, part.radius, part.height, Math.max(24, part.segments || 32))
        : new RoundedBoxGeometry(...part.size, 2, Math.min(.035, Math.min(...part.size) * .12));
      material = makeMaterial(part);
    }
    const object = new THREE.Mesh(geometry, material);
    if (part.position) object.position.fromArray(part.position);
    // The legacy catalog rotates X, then Y, then Z in world coordinates.
    if (part.rotation) object.rotation.set(...part.rotation, 'ZYX');
    object.castShadow = (part.alpha ?? 1) >= .9;
    object.receiveShadow = true;
    group.add(object);
  }
  const bounds = new THREE.Box3().setFromObject(group);
  const center = bounds.getCenter(new THREE.Vector3());
  group.position.set(-center.x, -bounds.min.y, -center.z);
  group.updateMatrixWorld(true);
  // Retain the shared texture even for models using only mesh geometry.
  group.userData.textures = [grain];
  return group;
}

export function disposeProductScene(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((object) => {
    if (object.geometry) geometries.add(object.geometry);
    for (const texture of object.userData.textures || []) textures.add(texture);
    for (const material of [object.material].flat().filter(Boolean)) {
      materials.add(material);
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  geometries.forEach((value) => value.dispose());
  materials.forEach((value) => value.dispose());
  textures.forEach((value) => value.dispose());
}

export function cameraFitDistance(radius, aspect, fieldOfView = 38) {
  const vertical = THREE.MathUtils.degToRad(fieldOfView / 2);
  const horizontal = Math.atan(Math.tan(vertical) * Math.max(.1, aspect));
  return Math.max(.1, radius) / Math.sin(Math.min(vertical, horizontal)) * 1.12;
}
