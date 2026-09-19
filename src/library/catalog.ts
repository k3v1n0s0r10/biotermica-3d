import type { Group, PerspectiveCamera } from 'three';
import { createFanAnimation, fanDuration } from '../animations/fan';
import {
  type AnimationSequence,
  createTurntable,
} from '../animations/turntable';
import { requireValue } from '../core/require-value';
import { createCompressor } from '../models/components/compressor';
import { createHeatPump } from '../models/heat-pump';
import type { createStudio } from '../scenes/studio';
import {
  createHeatPumpCycle,
  showcaseDuration,
} from '../showcases/heat-pump-cycle';

export interface ModelEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  create(): Group;
  camera: [number, number, number];
  target: [number, number, number];
}
export interface AnimationEntry {
  id: string;
  name: string;
  description: string;
  duration: number;
  modelIds: string[];
  create(model: Group): AnimationSequence;
}
export interface ShowcaseEntry {
  id: string;
  name: string;
  description: string;
  duration: number;
  modelId: string;
  edition: string;
  chapters: readonly (readonly [string, string, string])[];
  create(
    stage: ReturnType<typeof createStudio>,
    camera: PerspectiveCamera,
  ): { duration: number; sample(seconds: number): number };
}
export const models: ModelEntry[] = [
  {
    id: 'heat-pump-v1',
    name: 'Bomba de calor',
    version: 'V1 · Exterior',
    description:
      'Gabinete de color grafito, paneles curvos y conexiones de agua en PVC. La base para futuros componentes internos.',
    create: createHeatPump,
    camera: [2.35, 1.85, 2.65],
    target: [0, 0.55, 0],
  },
  {
    id: 'compressor-v1',
    name: 'Compresor hermético',
    version: 'V1 · Referencia fotográfica',
    description:
      'Carcasa negra esmaltada, conexiones de cobre y base de cuatro apoyos. Dimensiones aproximadas.',
    create: createCompressor,
    camera: [0.48, 0.43, 0.94],
    target: [0, 0.21, 0],
  },
];
export const animations: AnimationEntry[] = [
  {
    id: 'turntable',
    name: 'Vista de 360°',
    description: 'Un giro de ocho segundos para explorar todo el exterior.',
    duration: 8,
    modelIds: ['heat-pump-v1', 'compressor-v1'],
    create: createTurntable,
  },
  {
    id: 'fan-study',
    name: 'Movimiento del ventilador',
    description:
      'Explora el rotor de cinco aspas en movimiento con el gabinete quieto.',
    duration: fanDuration,
    modelIds: ['heat-pump-v1'],
    create(model) {
      const fan = createFanAnimation(model);
      return {
        duration: fan.duration,
        sample(seconds) {
          model.rotation.y = 0;
          fan.sample(seconds);
        },
      };
    },
  },
];
export const showcases: ShowcaseEntry[] = [
  {
    id: 'form-in-motion',
    name: 'El calor del aire, en tu agua',
    edition: 'Tecnología para disfrutar',
    description:
      'Descubre cómo aprovechamos el calor del aire para calentar tu agua en cuatro pasos.',
    duration: showcaseDuration,
    modelId: 'heat-pump-v1',
    create: createHeatPumpCycle,
    chapters: [
      [
        'CAPTAMOS EL CALOR',
        'El calor empieza\nen el aire.',
        'El aire entra por los paneles laterales.',
      ],
      [
        'APROVECHAMOS SU ENERGÍA',
        'Su calor se queda.\nEl aire frío sale.',
        'El ventilador expulsa el aire después de ceder calor.',
      ],
      [
        'AGUA MÁS CÁLIDA',
        'Más calidez.\nMás momentos.',
        'El agua caliente sale hacia tu piscina o espacio de bienestar.',
      ],
      [
        'EL CICLO CONTINÚA',
        'Tu agua vuelve.\nEl bienestar sigue.',
        'El agua fría entra para volver a calentarse.',
      ],
    ],
  },
];
export interface Selection {
  mode: 'showcase' | 'studio';
  modelId: string;
  animationId: string;
  showcaseId: string;
}
/** Resolve stale links and constrain animations to the chosen model. */
export function resolveSelection(input: Partial<Selection>): Selection {
  const film =
    showcases.find((entry) => entry.id === input.showcaseId) ??
    requireValue(showcases[0]);
  const mode = input.mode === 'studio' ? 'studio' : 'showcase';
  const model =
    models.find(
      (entry) =>
        entry.id === (mode === 'showcase' ? film.modelId : input.modelId),
    ) ?? requireValue(models[0]);
  const compatible = animations.filter((entry) =>
    entry.modelIds.includes(model.id),
  );
  const animation =
    compatible.find((entry) => entry.id === input.animationId) ?? compatible[0];
  return {
    mode,
    modelId: model.id,
    animationId: animation?.id ?? '',
    showcaseId: film.id,
  };
}
