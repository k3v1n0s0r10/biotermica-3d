import {
  type CurvePath,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  LineCurve3,
  Mesh,
  type MeshStandardMaterial,
  Path,
  Shape,
  Vector2,
  Vector3,
} from 'three';

/** Rigid pipe lengths joined by separate moulded elbows and socket cuffs.
 * Geometry belongs to this run; the owning assembly supplies its PVC material.
 */
export function createPvcPipeRun(
  path: CurvePath<Vector3>,
  material: MeshStandardMaterial,
) {
  const root = new Group();
  for (const curve of path.curves) {
    const straight = curve instanceof LineCurve3;
    const section = new Shape();
    section.absarc(0, 0, straight ? 0.025 : 0.029, 0, Math.PI * 2, false);
    const bore = new Path();
    bore.absarc(0, 0, 0.019, 0, Math.PI * 2, true);
    section.holes.push(bore);
    const body = new Mesh(
      new ExtrudeGeometry(section, {
        extrudePath: curve,
        steps: straight ? 1 : 48,
        bevelEnabled: false,
        curveSegments: 24,
      }),
      material,
    );
    body.name = straight ? 'pvc-straight-pipe' : 'pvc-elbow-body';
    if (straight) root.add(body);
    else {
      const elbow = new Group();
      elbow.name = 'pvc-elbow';
      elbow.add(body);
      for (const end of [0, 1]) {
        // Raised socket rims make the pipe-to-fitting joints visible.
        const cuff = new Mesh(
          new LatheGeometry(
            [
              new Vector2(0.025, -0.009),
              new Vector2(0.032, -0.009),
              new Vector2(0.032, 0.009),
              new Vector2(0.025, 0.009),
              new Vector2(0.025, -0.009),
            ],
            48,
          ),
          material,
        );
        cuff.name = 'pvc-elbow-socket';
        cuff.position.copy(curve.getPoint(end));
        cuff.quaternion.setFromUnitVectors(
          new Vector3(0, 1, 0),
          curve.getTangent(end),
        );
        elbow.add(cuff);
      }
      root.add(elbow);
    }
  }
  return root;
}
