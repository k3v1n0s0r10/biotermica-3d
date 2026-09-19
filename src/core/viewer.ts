import {
  ACESFilmicToneMapping,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PMREMGenerator,
  SRGBColorSpace,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { AnimationEntry, ModelEntry, ShowcaseEntry } from '../library/catalog';
import { createStudio } from '../scenes/studio';
import { disposeObject } from './dispose';
import { requireValue } from './require-value';

export function createViewer(
  container: HTMLElement,
  options: { model: ModelEntry; animation?: AnimationEntry; showcase?: ShowcaseEntry },
) {
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  container.append(renderer.domElement);
  const stage = createStudio(options.model.create());
  const { scene, product } = stage;
  const environmentRoom = new RoomEnvironment();
  const pmrem = new PMREMGenerator(renderer);
  const environment = pmrem.fromScene(environmentRoom, 0.04);
  scene.environment = environment.texture;
  scene.environmentIntensity = 0.7;
  environmentRoom.dispose();
  pmrem.dispose();
  const camera = new PerspectiveCamera(35, 1, 0.01, 250);
  camera.position.fromArray(options.model.camera);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.fromArray(options.model.target);
  controls.minDistance = 1;
  controls.maxDistance = 10;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.update();
  controls.saveState();
  const sequence = options.animation?.create(product) ?? { duration: 1, sample() {} };
  const showcase = options.showcase?.create(stage, camera);
  let mode: 'showcase' | 'studio' = showcase ? 'showcase' : 'studio';
  let lastSampleTime = 0;
  controls.enabled = false;
  const render = () => renderer.render(scene, camera);
  controls.addEventListener('change', render);
  const resize = new ResizeObserver(() => {
    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (mode === 'showcase') showcase?.sample(lastSampleTime);
    render();
  });
  resize.observe(container);
  function resetStudio() {
    const fan = product.getObjectByName('fan-rotor');
    if (fan) fan.rotation.y = 0;
    (scene.background as import('three').Color).setHex(0xe9eeed);
    requireValue(scene.fog).color.setHex(0xe9eeed);
    stage.floor.material.color.setHex(0xe9eeed);
    stage.floor.material.roughness = 1;
    stage.floor.material.metalness = 0;
    scene.environmentIntensity = 0.7;
    stage.ambient.intensity = 2;
    stage.key.color.setHex(0xfff5e8);
    stage.key.intensity = 3;
    stage.key.position.set(3, 5, 4);
    stage.fill.intensity = stage.rim.intensity = 0;
  }
  return {
    get duration() {
      return mode === 'showcase' ? requireValue(showcase).duration : sequence.duration;
    },
    setMode(next: 'showcase' | 'studio') {
      mode = next === 'showcase' && showcase ? 'showcase' : 'studio';
      controls.enabled = mode === 'studio';
      if (mode === 'studio') {
        controls.reset();
        product.rotation.y = 0;
        resetStudio();
      }
    },
    renderAt(seconds: number) {
      lastSampleTime = seconds;
      let chapter = 0;
      if (mode === 'showcase') chapter = showcase?.sample(seconds) ?? 0;
      else sequence.sample(seconds);
      render();
      return chapter ?? 0;
    },
    resetView() {
      controls.reset();
      render();
    },
    dispose() {
      resize.disconnect();
      controls.removeEventListener('change', render);
      controls.dispose();
      disposeObject(scene);
      environment.dispose();
      scene.traverse((object) => {
        if ('shadow' in object) (object as import('three').DirectionalLight).shadow?.dispose();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
