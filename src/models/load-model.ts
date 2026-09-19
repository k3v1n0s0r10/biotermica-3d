import { Mesh } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Loads standard GLB/glTF without changing authored scale, names, or clips. */
export async function loadModel(path: string) {
  const url = `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
  try {
    const gltf = await new GLTFLoader().loadAsync(url);
    gltf.scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
      }
    });
    return gltf;
  } catch (cause) {
    throw new Error(`Could not load model: ${url}`, { cause });
  }
}
