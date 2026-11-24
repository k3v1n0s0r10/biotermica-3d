import type { ModelViewerElement } from '@google/model-viewer';
import {
  assetPath,
  type PreviewMode,
  type Product,
  products,
  resolveMode,
  resolveProduct,
} from './catalog';
import { requireValue } from './core/require-value';
import './style.css';

const preview = requireValue(document.querySelector<HTMLElement>('#preview'));
const status = requireValue(
  document.querySelector<HTMLElement>('#preview-status'),
);
const heading = requireValue(
  document.querySelector<HTMLElement>('#product-name'),
);
const help = requireValue(document.querySelector<HTMLElement>('#preview-help'));
const download = requireValue(
  document.querySelector<HTMLAnchorElement>('#asset-download'),
);
const category = requireValue(
  document.querySelector<HTMLElement>('#product-category'),
);
const description = requireValue(
  document.querySelector<HTMLElement>('#product-description'),
);
const format = requireValue(
  document.querySelector<HTMLElement>('#format-label'),
);
const modeButtons = document.querySelectorAll<HTMLButtonElement>('[data-mode]');
const base = import.meta.env.BASE_URL;
const events = new AbortController();
let mediaEvents = new AbortController();
let video: HTMLVideoElement | undefined;
let model: ModelViewerElement | undefined;
let revision = 0;
let current = resolveProduct(null);
let mode: PreviewMode = 'image';
const failedModels = new Map<string, number>();

const labels = {
  image: ['PNG', 'Render de Blender Cycles.', 'poster.png', 'Descargar PNG'],
  video: [
    'MP4 · 480 × 480 · 24 FPS',
    'Órbita de 15 s: frente, laterales y ventilador. Sin audio.',
    'orbit.mp4',
    'Descargar MP4',
  ],
  model: [
    'GLB',
    'Arrastrar o flechas: girar. Rueda o pellizco: zoom.',
    'model.glb',
    'Descargar GLB',
  ],
};

function poster(product: Product) {
  const image = document.createElement('img');
  image.src = assetPath(product, 'poster.png', base);
  image.alt = `${product.name}. Vista de producto sobre fondo blanco.`;
  image.width = image.height = 1200;
  image.addEventListener(
    'error',
    () => {
      status.textContent =
        'Error al cargar el PNG. Recarga o descarga el archivo.';
    },
    { signal: mediaEvents.signal },
  );
  return image;
}

function modelSource(product: Product) {
  const attempt = failedModels.get(product.id) ?? 0;
  const path = assetPath(product, 'model.glb', base);
  // The viewer caches rejected GLB requests. A retry needs a fresh cache key.
  return attempt > 0 ? `${path}?attempt=${attempt}` : path;
}

function modelFailed(product: Product) {
  failedModels.set(product.id, (failedModels.get(product.id) ?? 0) + 1);
  preview.removeAttribute('aria-busy');
  preview.replaceChildren(poster(product));
  status.textContent =
    'Error al cargar el GLB. Reintenta con Modelo 3D o descarga el archivo.';
}

async function showModel(product: Product, request: number) {
  preview.setAttribute('aria-busy', 'true');
  try {
    const { ModelViewerElement } = await import('@google/model-viewer');
    if (request !== revision) return;
    model = new ModelViewerElement();
    model.src = modelSource(product);
    model.poster = assetPath(product, 'poster.png', base);
    model.alt = `${product.name}. Modelo interactivo exportado desde Blender.`;
    model.cameraControls = true;
    model.shadowIntensity = 0;
    model.cameraOrbit = '45deg 65deg auto';
    model.setAttribute('touch-action', 'pan-y');
    model.setAttribute('interaction-prompt', 'none');
    model.addEventListener('load', () => preview.removeAttribute('aria-busy'), {
      signal: mediaEvents.signal,
    });
    model.addEventListener('error', () => modelFailed(product), {
      signal: mediaEvents.signal,
    });
    preview.replaceChildren(model);
  } catch (error) {
    if (request !== revision) return;
    console.error(error);
    preview.removeAttribute('aria-busy');
    status.textContent =
      'Error al iniciar WebGL. Usa el PNG o descarga el GLB.';
  }
}

function showVideo(product: Product) {
  video = document.createElement('video');
  video.controls = true;
  video.muted = true;
  video.playsInline = true;
  video.loop = true;
  video.preload = 'none';
  video.width = video.height = 480;
  video.poster = assetPath(product, 'poster.png', base);
  video.src = assetPath(product, 'orbit.mp4', base);
  video.setAttribute('aria-describedby', 'preview-help');
  video.setAttribute('aria-label', `Video de ${product.name}`);
  video.addEventListener(
    'error',
    () => {
      status.textContent =
        'Error al reproducir el MP4. Descarga el archivo o usa el PNG.';
    },
    { signal: mediaEvents.signal },
  );
  preview.replaceChildren(video);
}

function pause() {
  video?.pause();
  model?.pause();
}

function updateDetails(product: Product) {
  heading.textContent = product.name;
  category.textContent = product.category.toUpperCase();
  description.textContent = product.description;
  document.title = `${product.name} · Estudio Blender · Biotérmica`;
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    '[data-product]',
  )) {
    button.setAttribute(
      'aria-current',
      String(button.dataset.product === product.id),
    );
  }
  for (const button of modeButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.mode === mode));
    button.hidden = button.dataset.mode === 'video' && !product.video;
  }
  const [formatText, helpText, filename, downloadText] = requireValue(
    labels[mode],
  );
  format.textContent = requireValue(formatText);
  help.textContent = requireValue(helpText);
  download.href = assetPath(product, requireValue(filename), base);
  download.textContent = `${requireValue(downloadText)} ↓`;
}

function select(product: Product, nextMode: PreviewMode, writeLocation = true) {
  pause();
  mediaEvents.abort();
  mediaEvents = new AbortController();
  video = undefined;
  model = undefined;
  current = product;
  mode = nextMode;
  revision++;
  preview.removeAttribute('aria-busy');
  status.textContent = '';
  updateDetails(product);
  preview.replaceChildren(poster(product));
  if (mode === 'video') showVideo(product);
  if (mode === 'model') void showModel(product, revision);
  if (writeLocation) {
    const url = new URL(location.href);
    url.search = new URLSearchParams({
      product: product.id,
      view: mode,
    }).toString();
    history.pushState(null, '', url);
  }
}

function readLocation() {
  const params = new URLSearchParams(location.search);
  const product = resolveProduct(params.get('product') ?? params.get('model'));
  select(product, resolveMode(params.get('view'), product), false);
}

function createLibrary() {
  const list = requireValue(document.querySelector('#product-list'));
  for (const product of products) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'product-button';
    button.dataset.product = product.id;
    const image = document.createElement('img');
    image.src = assetPath(product, 'poster.png', base);
    image.alt = '';
    image.width = image.height = 54;
    image.loading = 'lazy';
    const text = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = product.name;
    const subtitle = document.createElement('small');
    subtitle.textContent = product.category;
    text.append(title, subtitle);
    button.append(image, text);
    button.addEventListener(
      'click',
      () => select(product, resolveMode(mode, product)),
      { signal: events.signal },
    );
    list.append(button);
  }
}

for (const button of modeButtons) {
  button.addEventListener(
    'click',
    () => select(current, resolveMode(button.dataset.mode ?? null, current)),
    { signal: events.signal },
  );
}
window.addEventListener('popstate', readLocation, { signal: events.signal });
document.addEventListener(
  'visibilitychange',
  () => {
    if (document.hidden) pause();
  },
  { signal: events.signal },
);
window.addEventListener('pagehide', pause, { signal: events.signal });
createLibrary();
readLocation();
import.meta.hot?.dispose(() => {
  pause();
  revision++;
  events.abort();
  mediaEvents.abort();
  preview.replaceChildren();
});
