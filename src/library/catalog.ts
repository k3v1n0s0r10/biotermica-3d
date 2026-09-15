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
  id: 'heat-pump-v1', name: 'Bomba de calor', version: 'V1 · Exterior',
  description: 'Gabinete de color grafito, paneles curvos y conexiones de agua en PVC. La base para futuros componentes internos.',
  create: createHeatPump, camera: [2.35, 1.85, 2.65], target: [0, 0.55, 0],
}];
export const animations: AnimationEntry[] = [
  { id: 'turntable', name: 'Vista de 360°', description: 'Un giro de ocho segundos para explorar todo el exterior.', duration: 8, modelIds: ['heat-pump-v1'], create: createTurntable },
  { id: 'fan-study', name: 'Movimiento del ventilador', description: 'Explora el rotor de cinco aspas en movimiento con el gabinete quieto.', duration: 6, modelIds: ['heat-pump-v1'], create(model) {
    const fan = model.getObjectByName('fan-rotor');
    if (!fan) throw new Error('Fan motion requires a fan-rotor group.');
    return { duration: 6, sample(seconds) { model.rotation.y = 0; fan.rotation.y = loopTime(seconds, 6) / 6 * Math.PI * 2; } };
  } },
];
export const showcases: ShowcaseEntry[] = [{
  id: 'form-in-motion', name: 'El calor del aire, en tu agua', edition: 'Tecnología para disfrutar',
  description: 'Descubre cómo aprovechamos el calor del aire para calentar tu agua en cuatro pasos.',
  duration: 24, modelId: 'heat-pump-v1', create: createShowcase,
  chapters: [
    ['CAPTAMOS EL CALOR', 'El calor empieza\nen el aire.', 'El aire entra por los paneles laterales.'],
    ['APROVECHAMOS SU ENERGÍA', 'Su calor se queda.\nEl aire frío sale.', 'El ventilador expulsa el aire después de ceder calor.'],
    ['AGUA MÁS CÁLIDA', 'Más calidez.\nMás momentos.', 'El agua caliente sale hacia tu piscina o espacio de bienestar.'],
    ['EL CICLO CONTINÚA', 'Tu agua vuelve.\nEl bienestar sigue.', 'El agua fría entra para volver a calentarse.'],
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
