import type { Group, PerspectiveCamera } from 'three';
import { createHeatPump } from '../models/heat-pump';
import { createTurntable, loopTime, type AnimationSequence } from '../animations/turntable';
import { createShowcase } from '../animations/showcase';
import type { createStudio } from '../scenes/studio';

export interface ModelEntry {
  id: string; name: string; description: string; version: string;
  create(): Group;
  camera: [number, number, number]; target: [number, number, number];
}
export interface AnimationEntry {
  id: string; name: string; description: string; duration: number;
  modelIds: string[];
  create(model: Group): AnimationSequence;
}
export interface ShowcaseEntry {
  id: string; name: string; description: string; duration: number; modelId: string;
  edition: string;
  chapters: readonly (readonly [string, string, string])[];
  create(stage: ReturnType<typeof createStudio>, camera: PerspectiveCamera): { duration: number; sample(seconds: number): number };
}
export const models: ModelEntry[] = [{
  id: 'heat-pump-v1', name: 'Heat pump', version: 'V1 · Exterior',
  description: 'Charcoal cabinet, curved panels and PVC water connections. The base for our future internal assemblies.',
  create: createHeatPump, camera: [2.35, 1.85, 2.65], target: [0, 0.55, 0],
}];
export const animations: AnimationEntry[] = [
  { id: 'turntable', name: 'Full turntable', description: 'An eight-second rotation for inspecting the complete exterior.', duration: 8, modelIds: ['heat-pump-v1'], create: createTurntable },
  { id: 'fan-study', name: 'Fan motion', description: 'Keep the cabinet still and explore the five-blade rotor in motion.', duration: 6, modelIds: ['heat-pump-v1'], create(model) {
    const fan = model.getObjectByName('fan-rotor');
    if (!fan) throw new Error('Fan motion requires a fan-rotor group.');
    return { duration: 6, sample(seconds) { model.rotation.y = 0; fan.rotation.y = loopTime(seconds, 6) / 6 * Math.PI * 2; } };
  } },
];
export const showcases: ShowcaseEntry[] = [{
  id: 'form-in-motion', name: 'Form in motion', edition: 'Charcoal edition',
  description: 'A cinematic study in teal, violet and warm light. Four camera movements, one complete product.',
  duration: 24, modelId: 'heat-pump-v1', create: createShowcase,
  chapters: [
    ['THE REVEAL', 'A new\nperspective.', 'A study in form, detail and movement.'],
    ['FROM ABOVE', 'Every angle.\nConsidered.', 'The fan, the guard, the geometry.'],
    ['THE DETAILS', 'Closer to\nthe details.', 'Curved panels. Clean lines. Water connections.'],
    ['THE COMPLETE FORM', 'Made of\npossibilities.', 'One shell. The beginning of a bigger system.'],
  ],
}];
export interface Selection { mode: 'showcase' | 'studio'; modelId: string; animationId: string; showcaseId: string }
/** Resolve stale links and constrain animations to the chosen model. */
export function resolveSelection(input: Partial<Selection>): Selection {
  const film = showcases.find(entry => entry.id === input.showcaseId) ?? showcases[0]!;
  const mode = input.mode === 'studio' ? 'studio' : 'showcase';
  const model = models.find(entry => entry.id === (mode === 'showcase' ? film.modelId : input.modelId)) ?? models[0]!;
  const compatible = animations.filter(entry => entry.modelIds.includes(model.id));
  const animation = compatible.find(entry => entry.id === input.animationId) ?? compatible[0];
  return { mode, modelId: model.id, animationId: animation?.id ?? '', showcaseId: film.id };
}
