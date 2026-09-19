import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshPhysicalMaterial,
  NormalBlending,
  type Object3D,
  TubeGeometry,
  Vector3,
} from 'three';
import { requireValue } from '../core/require-value';
import { loopTime } from './turntable';

const fract = (value: number) => value - Math.floor(value);
const seed = (index: number, salt: number) =>
  fract(Math.sin(index * 127.1 + salt * 311.7) * 43758.5453);
const smooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const flowStageAt = (seconds: number) => Math.floor(loopTime(seconds, 24) / 6);

function airPosition(
  stage: number,
  i: number,
  random: number[],
  p: number,
  target: Vector3,
) {
  let x = 0,
    y = 0,
    z = 0;
  if (stage === 0) {
    const side = i % 4;
    // Accelerate and converge smoothly toward the side grilles.
    // Broad ambient air contracts into the intake, without oscillation.
    const pull = 0.35 * p + 0.65 * p * p;
    const spread = 1.65 - 0.65 * pull;
    const lateral = -0.095 + (requireValue(random[1]) - 0.5) * 0.51 * spread;
    const distance = 1.05 - pull * 0.62;
    const intakeHeight = 0.24 + requireValue(random[2]) * 0.7;
    y = intakeHeight + (intakeHeight - 0.59) * 0.4 * (1 - pull);
    if (side === 0) {
      x = lateral;
      z = distance;
    }
    if (side === 1) {
      x = distance;
      z = lateral;
    }
    if (side === 2) {
      x = lateral;
      z = -distance;
    }
    if (side === 3) {
      x = -distance;
      z = lateral;
    }
  } else if (stage === 1) {
    const angle = requireValue(random[3]) * Math.PI * 2 + p * 0.7;
    const radius = 0.08 + Math.sqrt(requireValue(random[4])) * 0.23 + p * 0.12;
    x = Math.cos(angle) * radius;
    z = Math.sin(angle) * radius;
    y = 1.1 + p * 0.85;
  }

  return target.set(x, y, z);
}

/** Illustrative flow directions, not a fluid simulation. All particles use absolute time. */
export function createHeatFlow(product: Object3D) {
  const cabinet = product.getObjectByName('cabinet');
  if (!cabinet) throw new Error('Heat flow requires a cabinet group.');
  const sockets = cabinet.children
    .filter((node) => node.name === 'pvc-water-socket')
    .sort((a, b) => a.position.x - b.position.x);
  if (sockets.length < 2)
    throw new Error('Heat flow requires two PVC water sockets.');
  const ports = sockets.map((socket) =>
    socket.position.clone().add(new Vector3(0, 0, 0.065)),
  );
  const root = new Group();
  root.name = 'showcase-heat-flow';
  cabinet.add(root);
  const trailLength = 8;
  const trailFractions = [1, 0.75, 0.75, 0.5, 0.5, 0.25, 0.25, 0];
  const systems = [0xffca83, 0x86ddfa].map((tint, stage) => {
    const count = 9_000;
    const seeds = Array.from({ length: count }, (_, i) =>
      Array.from({ length: 5 }, (_, salt) => seed(i, salt + 1)),
    );
    const positions = new Float32Array(count * trailLength * 3);
    const colors = new Float32Array(count * trailLength * 4);
    const color = new Color(tint);
    for (let i = 0; i < count; i++)
      for (let tail = 0; tail < trailLength; tail++) {
        const offset = (i * trailLength + tail) * 4;
        colors[offset] = color.r;
        colors[offset + 1] = color.g;
        colors[offset + 2] = color.b;
        // Fade to transparent at both ends, rather than leaving bright dust-like heads.
        colors[offset + 3] =
          Math.sin(requireValue(trailFractions[tail]) * Math.PI) ** 2;
      }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new Float32BufferAttribute(colors, 4));
    const material = new LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: NormalBlending,
      toneMapped: false,
    });
    const points = new LineSegments(geometry, material);
    points.frustumCulled = false;
    points.name = requireValue(
      [
        'warm-air-intake',
        'cold-air-exhaust',
        'hot-water-outlet',
        'cold-water-inlet',
      ][stage],
    );
    root.add(points);
    return { points, count, stage, seeds };
  });
  // A refractive, continuous liquid jet. Surface waves travel with the flow.
  const water = [2, 3].map((stage) => {
    const group = new Group();
    group.name = stage === 2 ? 'hot-water-outlet' : 'cold-water-inlet';
    root.add(group);
    const port = requireValue(ports[stage === 2 ? 0 : 1]);
    const path = new CatmullRomCurve3(
      Array.from({ length: 33 }, (_, i) => {
        const d = i / 32;
        return new Vector3(
          port.x,
          port.y - (stage === 2 ? 0.1 : 0.025) * d * d,
          port.z + d * 0.36,
        );
      }),
    );
    const material = new MeshPhysicalMaterial({
      color: stage === 2 ? 0xffe6df : 0x79d8ff,
      metalness: 0,
      roughness: 0.055,
      transmission: 0.96,
      thickness: 0.028,
      ior: 1.333,
      attenuationColor: new Color(stage === 2 ? 0xffb6a8 : 0x24aeef),
      attenuationDistance: stage === 2 ? 0.3 : 0.18,
      envMapIntensity: 1.4,
      clearcoat: 0.35,
      clearcoatRoughness: 0.035,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const geometry = new TubeGeometry(path, 128, 0.014, 24, false);
    const rest = Float32Array.from(geometry.getAttribute('position').array);
    const centers = Array.from({ length: 129 }, (_, i) =>
      path.getPointAt(i / 128),
    );
    const stream = new Mesh(geometry, material);
    stream.name = 'water-surface';
    stream.frustumCulled = false;
    group.add(stream);
    return { stage, group, material, geometry, rest, centers };
  });
  function sampleAir(
    { points, count, stage, seeds }: (typeof systems)[number],
    t: number,
    active: number,
    local: number,
  ) {
    points.visible = stage === active;
    points.material.opacity =
      stage === active
        ? 0.035 * smooth(local / 0.4) * smooth((6 - local) / 0.45)
        : 0;
    if (!points.visible) return;
    const position = points.geometry.getAttribute('position');
    const point = new Vector3();
    for (let i = 0; i < count; i++)
      for (let tail = 0; tail < trailLength; tail++) {
        const random = requireValue(seeds[i]);
        // Long, overlapping wisps blend into a continuous current.
        // Shared, slow breathing gives the flow coherence instead of a swarm.
        const stretch =
          0.2 +
          0.09 * (0.5 + 0.5 * Math.sin(t * 2.2 + requireValue(random[2]) * 2));
        const head =
          fract(
            t / (0.7 + requireValue(random[4]) * 0.25) +
              requireValue(random[0]),
          ) * 1.3;
        const p = Math.max(
          0,
          Math.min(1, head - stretch * requireValue(trailFractions[tail])),
        );
        airPosition(stage, i, random, p, point);
        position.setXYZ(i * trailLength + tail, point.x, point.y, point.z);
      }
    position.needsUpdate = true;
  }
  function sampleWater(
    { stage, group, material, geometry, rest, centers }: (typeof water)[number],
    t: number,
    active: number,
    local: number,
  ) {
    group.visible = stage === active;
    const fade =
      stage === active ? smooth(local / 0.4) * smooth((6 - local) / 0.45) : 0;
    material.opacity = fade;
    if (!group.visible) return;
    const positions = geometry.getAttribute('position');
    const direction = stage === 2 ? 1 : -1;
    for (let ring = 0; ring <= 128; ring++) {
      const d = ring / 128;
      const center = requireValue(centers[ring]);
      const phase = d * 32 - t * 9 * direction;
      // Keep the socket connection fixed; let the free stream narrow and ripple.
      const envelope = smooth(d * 12);
      for (let j = 0; j <= 24; j++) {
        const angle = (j / 24) * Math.PI * 2;
        const swell =
          1 -
          d * 0.1 +
          envelope *
            (0.045 * Math.sin(phase + Math.sin(angle * 2) * 0.7) +
              0.018 * Math.sin(phase * 1.9 - angle * 3));
        const i = ring * 25 + j,
          offset = i * 3;
        positions.setXYZ(
          i,
          center.x + (requireValue(rest[offset]) - center.x) * swell,
          center.y + (requireValue(rest[offset + 1]) - center.y) * swell,
          center.z + (requireValue(rest[offset + 2]) - center.z) * swell,
        );
      }
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  }
  return {
    root,
    sample(seconds: number) {
      const t = loopTime(seconds, 24),
        active = flowStageAt(t);
      const local = t - active * 6;
      for (const system of systems) sampleAir(system, t, active, local);
      for (const stream of water) sampleWater(stream, t, active, local);
      return active;
    },
  };
}
