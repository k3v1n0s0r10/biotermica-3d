import { Color } from 'three';
import type { createStudio } from './studio';

/** Neutral, scenery-free lighting shared by white product presentations. */
export function applyWhitePresentation(stage: ReturnType<typeof createStudio>) {
  const white = new Color(0xffffff);
  stage.scene.background = white;
  stage.scene.fog?.color.copy(white);
  stage.floor.visible = false;
  stage.scene.environmentIntensity = 0.25;
  stage.ambient.color.setHex(0xffffff);
  stage.ambient.groundColor.setHex(0xbfc5cb);
  stage.ambient.intensity = 0.9;
  stage.key.color.setHex(0xffffff);
  stage.key.intensity = 1;
  stage.key.position.set(3, 5, 4);
  stage.fill.color.setHex(0xf1f5ff);
  stage.fill.intensity = 0.8;
  stage.rim.color.setHex(0xffffff);
  stage.rim.intensity = 0.5;
}
