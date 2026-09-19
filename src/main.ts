import { requireValue } from './core/require-value';
import './style.css';
import { loopTime } from './animations/turntable';
import { createViewer } from './core/viewer';
import { renderModelActions } from './library/actions';
import { createBackgroundChoice } from './library/background';
import {
  type AnimationEntry,
  animations,
  type ModelEntry,
  models,
  resolveSelection,
  type Selection,
  type ShowcaseEntry,
  showcases,
} from './library/catalog';
import { createLibrary } from './library/menu';

const viewport = requireValue(document.querySelector<HTMLElement>('#viewport'));
const play = requireValue(document.querySelector<HTMLButtonElement>('#play'));
const reset = requireValue(document.querySelector<HTMLButtonElement>('#reset'));
const slider = requireValue(
  document.querySelector<HTMLInputElement>('#timeline'),
);
const output = requireValue(document.querySelector<HTMLOutputElement>('#time'));
const filmButton = requireValue(
  document.querySelector<HTMLButtonElement>('#showcase'),
);
const studioButton = requireValue(
  document.querySelector<HTMLButtonElement>('#studio'),
);
const chapter = requireValue(document.querySelector<HTMLElement>('#chapter'));
const headline = requireValue(document.querySelector<HTMLElement>('#headline'));
const caption = requireValue(document.querySelector<HTMLElement>('#caption'));
const chapterNumber = requireValue(
  document.querySelector<HTMLElement>('#chapter-number'),
);
const hint = requireValue(document.querySelector<HTMLElement>('#hint'));
const params = new URLSearchParams(location.search);
let selection = resolveSelection({
  mode: params.get('mode') === 'studio' ? 'studio' : 'showcase',
  modelId: params.get('model') ?? '',
  animationId: params.get('animation') ?? '',
  showcaseId: params.get('showcase') ?? '',
});
const events = new AbortController();
const reducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;
let viewer: ReturnType<typeof createViewer> | undefined;
let playing = false,
  seconds = 0,
  startedAt = 0,
  frame = 0,
  lastChapter = -1;
let resumeOnVisible = false;
function updateChapter(index: number) {
  const film = requireValue(
    showcases.find((entry) => entry.id === selection.showcaseId),
  );
  if (lastChapter === index) return;
  const copy = film.chapters[index] ?? ['', '', ''];
  chapter.textContent = copy[0]
    ? `${String(index + 1).padStart(2, '0')} — ${copy[0]}`
    : '';
  headline.textContent = copy[1];
  caption.textContent = copy[2];
  chapterNumber.textContent = String(index + 1).padStart(2, '0');
  lastChapter = index;
}
const draw = () => {
  if (!viewer) return;
  const index = viewer.renderAt(seconds);
  document.body.dataset.chapter = String(index);
  updateChapter(index);
  slider.value = String(seconds);
  output.value = `${seconds.toFixed(2)} / ${viewer.duration.toFixed(2)} s`;
};
const background = createBackgroundChoice(draw, events.signal);
const tick = (now: number) => {
  if (!viewer) return;
  seconds = loopTime((now - startedAt) / 1000, viewer.duration);
  draw();
  frame = requestAnimationFrame(tick);
};
const pause = () => {
  playing = false;
  cancelAnimationFrame(frame);
  play.textContent = 'Reproducir';
};
const start = () => {
  if (playing || !viewer || play.disabled) return;
  playing = true;
  play.textContent = 'Pausar';
  startedAt = performance.now() - seconds * 1000;
  frame = requestAnimationFrame(tick);
};
function updateControls(
  model: ModelEntry,
  animation: AnimationEntry | undefined,
) {
  document.body.classList.toggle('showcase', selection.mode === 'showcase');
  filmButton.setAttribute(
    'aria-pressed',
    String(selection.mode === 'showcase'),
  );
  studioButton.setAttribute(
    'aria-pressed',
    String(selection.mode === 'studio'),
  );
  const modelFilms = showcases.filter((entry) => entry.modelId === model.id);
  filmButton.disabled = !modelFilms.length;
  const hasPlayback =
    selection.mode === 'showcase' ||
    (!!animation && animation.holdAt === undefined);
  play.disabled = slider.disabled = !hasPlayback;
  play.hidden = slider.hidden = output.hidden = !hasPlayback;
  reset.disabled = false;
  slider.max = String(requireValue(viewer).duration);
}
function updateLabels(
  model: ModelEntry,
  film: ShowcaseEntry,
  animation: AnimationEntry | undefined,
) {
  requireValue(document.querySelector('#active-model')).textContent =
    model.name;
  requireValue(document.querySelector('#active-experience')).textContent =
    selection.mode === 'showcase'
      ? film.name
      : (animation?.name ?? 'Inspección');
  requireValue(document.querySelector('#film-name')).textContent =
    film.name.toUpperCase();
  requireValue(document.querySelector('#film-edition-name')).textContent =
    film.edition.toUpperCase();
  requireValue(document.querySelector('#chapter-total')).textContent = String(
    film.chapters.length,
  ).padStart(2, '0');
  document.body.dataset.clean = String(film.clean);
  updateHints(model, film);
}
function updateHints(model: ModelEntry, film: ShowcaseEntry) {
  hint.textContent =
    selection.mode === 'showcase'
      ? `${requireValue(viewer).duration} s · Explora la secuencia`
      : 'Arrastra para girar · Desplaza para acercar';
  reset.setAttribute(
    'aria-label',
    selection.mode === 'showcase' ? 'Restart animation' : 'Reset view',
  );
  document.title = `Biotérmica · ${model.name} — ${selection.mode === 'showcase' ? film.name : 'Inspect'}`;
}
function updateLocation(model: ModelEntry, film: ShowcaseEntry) {
  const url = new URL(location.href);
  for (const [key, value] of Object.entries({
    mode: selection.mode,
    model: model.id,
    animation: selection.animationId,
    showcase: film.id,
  }))
    url.searchParams.set(key, value);
  history.replaceState(null, '', url);
}
function autoplaySelection(autoplay: boolean) {
  if ((selection.mode === 'showcase' || autoplay) && !reducedMotion) start();
}
function showSelectionError(error: unknown) {
  console.error(error);
  viewer?.dispose();
  viewer = undefined;
  document.body.classList.remove('showcase');
  requireValue(document.querySelector<HTMLElement>('#model-actions')).hidden =
    true;
  viewport.textContent =
    'This item could not be opened. Choose another item from the library or reload.';
  play.disabled = reset.disabled = slider.disabled = true;
}
function finishSelection(
  model: ModelEntry,
  film: ShowcaseEntry,
  animation: AnimationEntry | undefined,
  autoplay: boolean,
) {
  seconds = selection.mode === 'studio' ? (animation?.holdAt ?? 0) : 0;
  lastChapter = -1;
  requireValue(viewer).setMode(selection.mode);
  updateControls(model, animation);
  updateLabels(model, film, animation);
  updateLocation(model, film);
  renderModelActions(selection, (animationId) => select({ animationId }, true));
  draw();
  autoplaySelection(autoplay);
}
function select(input: Partial<Selection>, autoplay = false) {
  pause();
  resumeOnVisible = false;
  const next = resolveSelection({ ...selection, ...input });
  const model = requireValue(models.find((entry) => entry.id === next.modelId));
  const animation = animations.find((entry) => entry.id === next.animationId);
  const film = requireValue(
    showcases.find((entry) => entry.id === next.showcaseId),
  );
  viewer?.dispose();
  viewer = undefined;
  viewport.replaceChildren();
  try {
    viewer = createViewer(viewport, {
      model,
      animation,
      background,
      showcase: next.mode === 'showcase' ? film : undefined,
    });
    selection = next;
    finishSelection(model, film, animation, autoplay);
  } catch (error) {
    showSelectionError(error);
  }
}
const library = createLibrary((input) => select(input));
play.addEventListener('click', () => (playing ? pause() : start()), {
  signal: events.signal,
});
slider.addEventListener(
  'input',
  () => {
    pause();
    seconds = Number(slider.value);
    draw();
  },
  { signal: events.signal },
);
reset.addEventListener(
  'click',
  () => {
    if (selection.mode === 'studio' && selection.animationId) {
      select({ animationId: '' });
      return;
    }
    pause();
    seconds = 0;
    viewer?.resetView();
    draw();
  },
  { signal: events.signal },
);
filmButton.addEventListener(
  'click',
  () => {
    const film = showcases.find((entry) => entry.modelId === selection.modelId);
    if (film) select({ mode: 'showcase', showcaseId: film.id });
  },
  { signal: events.signal },
);
studioButton.addEventListener('click', () => select({ mode: 'studio' }), {
  signal: events.signal,
});
requireValue(document.querySelector('#library-open')).addEventListener(
  'click',
  () => {
    pause();
    resumeOnVisible = false;
    library.open(selection);
  },
  { signal: events.signal },
);
document.addEventListener(
  'visibilitychange',
  () => {
    if (document.hidden) {
      resumeOnVisible = playing;
      pause();
    } else if (resumeOnVisible) {
      resumeOnVisible = false;
      start();
    }
  },
  { signal: events.signal },
);
select(selection);
import.meta.hot?.dispose(() => {
  pause();
  events.abort();
  library.dispose();
  viewer?.dispose();
});
