import { NormalBlending, CatmullRomCurve3, InstancedMesh, Mesh, MeshPhysicalMaterial, Object3D, SphereGeometry, TubeGeometry, BufferGeometry, Color, DataTexture, Float32BufferAttribute, Group, LinearFilter, Points, PointsMaterial, Vector3 } from 'three';
import { loopTime } from './turntable';

const fract = (value: number) => value - Math.floor(value);
const seed = (index: number, salt: number) => fract(Math.sin(index * 127.1 + salt * 311.7) * 43758.5453);
const smooth = (value: number) => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
export const flowStageAt = (seconds: number) => Math.floor(loopTime(seconds, 24) / 6);

/** Illustrative flow directions, not a fluid simulation. All particles use absolute time. */
export function createHeatFlow(product: Object3D) {
  const cabinet = product.getObjectByName('cabinet');
  if (!cabinet) throw new Error('Heat flow requires a cabinet group.');
  const sockets = cabinet.children.filter(node => node.name === 'pvc-water-socket').sort((a, b) => a.position.x - b.position.x);
  if (sockets.length < 2) throw new Error('Heat flow requires two PVC water sockets.');
  const ports = sockets.map(socket => socket.position.clone().add(new Vector3(0, 0, 0.065)));
  const root = new Group(); root.name = 'showcase-heat-flow'; cabinet.add(root);
  const pixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const r = Math.hypot((x - 15.5) / 15.5, (y - 15.5) / 15.5);
    const offset = (y * 32 + x) * 4;
    pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
    pixels[offset + 3] = Math.round(Math.pow(Math.max(0, 1 - r), 0.55) * 255);
  }
  const sprite = new DataTexture(pixels, 32, 32);
  sprite.minFilter = sprite.magFilter = LinearFilter; sprite.needsUpdate = true;
  const trailLength = 4;
  const systems = [0xffca83, 0x86ddfa].map((tint, stage) => {
    const count = 360;
    const positions = new Float32Array(count * trailLength * 3);
    const colors = new Float32Array(positions.length);
    const color = new Color(tint);
    for (let i = 0; i < count; i++) for (let tail = 0; tail < trailLength; tail++) {
      const offset = (i * trailLength + tail) * 3;
      const intensity = 1 - tail / trailLength;
      colors[offset] = color.r * intensity; colors[offset + 1] = color.g * intensity; colors[offset + 2] = color.b * intensity;
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
    const material = new PointsMaterial({ size: 0.018, map: sprite, vertexColors: true, transparent: true, opacity: 0, depthWrite: false, blending: NormalBlending, toneMapped: false });
    const points = new Points(geometry, material); points.frustumCulled = false;
    points.name = ['warm-air-intake', 'cold-air-exhaust', 'hot-water-outlet', 'cold-water-inlet'][stage]!;
    root.add(points);
    return { points, count, stage };
  });
  // Water is a continuous rounded liquid surface with travelling beads, not point sprites.
  const water = [2, 3].map(stage => {
    const group = new Group();
    group.name = stage === 2 ? 'hot-water-outlet' : 'cold-water-inlet';
    root.add(group);
    const port = ports[stage === 2 ? 0 : 1]!;
    const path = new CatmullRomCurve3(Array.from({ length: 17 }, (_, i) => {
      const d = i / 16;
      return new Vector3(port.x, port.y - (stage === 2 ? 0.075 * d * d : 0), port.z + d * 0.36);
    }));
    const material = new MeshPhysicalMaterial({
      color: stage === 2 ? 0xa6dce7 : 0x42b9dc, metalness: 0,
      roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08,
      transparent: true, opacity: 0, depthWrite: false,
      emissive: stage === 2 ? 0xb94700 : 0x006f99, emissiveIntensity: 0.12,
    });
    const stream = new Mesh(new TubeGeometry(path, 72, 0.0135, 12, false), material);
    stream.name = 'water-surface'; group.add(stream);
    const beadMaterial = new MeshPhysicalMaterial({
      color: stage === 2 ? 0xffbf76 : 0xb0efff, roughness: 0.06, metalness: 0,
      clearcoat: 1, transparent: true, opacity: 0, depthWrite: false,
    });
    const beads = new InstancedMesh(new SphereGeometry(1, 8, 6), beadMaterial, 70);
    beads.name = 'moving-water-droplets'; beads.frustumCulled = false; group.add(beads);
    return { stage, group, path, material, beadMaterial, beads };
  });
  const dummy = new Object3D();
  const point = new Vector3();
  return {
    root,
    sample(seconds: number) {
      const t = loopTime(seconds, 24), active = flowStageAt(t);
      const local = t - active * 6;
      for (const { points, count, stage } of systems) {
        points.visible = stage === active;
        points.material.opacity = stage === active ? 0.95 * smooth(local / 0.4) * smooth((6 - local) / 0.45) : 0;
        const position = points.geometry.getAttribute('position');
        for (let i = 0; i < count; i++) for (let tail = 0; tail < trailLength; tail++) {
          const p = fract(t / (stage < 2 ? 2.4 : 1.8) + seed(i, 1) - tail * 0.014);
          let x = 0, y = 0, z = 0;
          if (stage === 0) {
            const side = i % 4;
            const lateral = -0.35 + seed(i, 2) * 0.51;
            const distance = 1.05 - p * 0.62;
            y = 0.24 + seed(i, 3) * 0.7 + Math.sin(p * Math.PI) * 0.045;
            if (side === 0) { x = lateral; z = distance; }
            if (side === 1) { x = distance; z = lateral; }
            if (side === 2) { x = lateral; z = -distance; }
            if (side === 3) { x = -distance; z = lateral; }
          } else if (stage === 1) {
            const angle = seed(i, 4) * Math.PI * 2 + p * 0.7;
            const radius = 0.08 + Math.sqrt(seed(i, 5)) * 0.23 + p * 0.12;
            x = Math.cos(angle) * radius; z = Math.sin(angle) * radius;
            y = 1.10 + p * 0.85;
          }
          position.setXYZ(i * trailLength + tail, x, y, z);
        }
        position.needsUpdate = true;
      }
      for (const { stage, group, path, material, beadMaterial, beads } of water) {
        group.visible = stage === active;
        const fade = stage === active ? smooth(local / 0.4) * smooth((6 - local) / 0.45) : 0;
        material.opacity = fade * 0.65;
        beadMaterial.opacity = fade * 0.8;
        for (let i = 0; i < beads.count; i++) {
          const p = fract(t / 1.7 + seed(i, 1));
          const d = stage === 2 ? p : 1 - p;
          path.getPoint(d, point);
          const angle = seed(i, 6) * Math.PI * 2 + d * 2;
          const radius = 0.009 * Math.sqrt(seed(i, 7));
          dummy.position.copy(point);
          dummy.position.x += Math.cos(angle) * radius;
          dummy.position.y += Math.sin(angle) * radius;
          const size = 0.0012 + seed(i, 8) * 0.0012;
          dummy.scale.set(size, size, size * 2.8);
          dummy.updateMatrix(); beads.setMatrixAt(i, dummy.matrix);
        }
        beads.instanceMatrix.needsUpdate = true;
      }
      return active;
    },
  };
}
