import './style.css';
import { createViewer } from './core/viewer';
import { loopTime } from './animations/turntable';
import { animations, models, showcases, resolveSelection, type Selection } from './library/catalog';
import { createLibrary } from './library/menu';

const viewport = document.querySelector<HTMLElement>('#viewport')!;
const play = document.querySelector<HTMLButtonElement>('#play')!;
const reset = document.querySelector<HTMLButtonElement>('#reset')!;
const slider = document.querySelector<HTMLInputElement>('#timeline')!;
const output = document.querySelector<HTMLOutputElement>('#time')!;
const filmButton = document.querySelector<HTMLButtonElement>('#showcase')!;
const studioButton = document.querySelector<HTMLButtonElement>('#studio')!;
const chapter = document.querySelector<HTMLElement>('#chapter')!;
const headline = document.querySelector<HTMLElement>('#headline')!;
const caption = document.querySelector<HTMLElement>('#caption')!;
const chapterNumber = document.querySelector<HTMLElement>('#chapter-number')!;
const hint = document.querySelector<HTMLElement>('#hint')!;
const params = new URLSearchParams(location.search);
let selection = resolveSelection({ mode: params.get('mode') === 'studio' ? 'studio' : 'showcase', modelId: params.get('model') ?? '', animationId: params.get('animation') ?? '', showcaseId: params.get('showcase') ?? '' });
const events = new AbortController();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let viewer: ReturnType<typeof createViewer> | undefined;
let playing = false, seconds = 0, startedAt = 0, frame = 0, lastChapter = -1;
let resumeOnVisible = false;
const draw = () => {
  if (!viewer) return;
  const index = viewer.renderAt(seconds);
  const film = showcases.find(entry => entry.id === selection.showcaseId)!;
  if (lastChapter !== index) {
    const copy = film.chapters[index];
    chapter.textContent = copy ? `${String(index + 1).padStart(2, '0')} — ${copy[0]}` : '';
    headline.textContent = copy?.[1] ?? '';
    caption.textContent = copy?.[2] ?? '';
    chapterNumber.textContent = String(index + 1).padStart(2, '0');
    lastChapter = index;
  }
  slider.value = String(seconds);
  output.value = `${seconds.toFixed(2)} / ${viewer.duration.toFixed(2)} s`;
};
const tick = (now: number) => {
  if (!viewer) return;
  seconds = loopTime((now - startedAt) / 1000, viewer.duration);
  draw(); frame = requestAnimationFrame(tick);
};
const pause = () => { playing = false; cancelAnimationFrame(frame); play.textContent = 'Play'; };
const start = () => {
  if (playing || !viewer) return;
  playing = true; play.textContent = 'Pause';
  startedAt = performance.now() - seconds * 1000;
  frame = requestAnimationFrame(tick);
};
function select(input: Partial<Selection>, autoplay = false) {
  pause(); resumeOnVisible = false;
  const next = resolveSelection({ ...selection, ...input });
  const model = models.find(entry => entry.id === next.modelId)!;
  const animation = animations.find(entry => entry.id === next.animationId);
  const film = showcases.find(entry => entry.id === next.showcaseId)!;
  viewer?.dispose(); viewer = undefined; viewport.replaceChildren();
  try {
    viewer = createViewer(viewport, { model, animation, showcase: next.mode === 'showcase' ? film : undefined });
    selection = next; seconds = 0; lastChapter = -1;
    viewer.setMode(selection.mode);
    document.body.classList.toggle('showcase', selection.mode === 'showcase');
    filmButton.setAttribute('aria-pressed', String(selection.mode === 'showcase'));
    studioButton.setAttribute('aria-pressed', String(selection.mode === 'studio'));
    const modelFilms = showcases.filter(entry => entry.modelId === model.id);
    filmButton.disabled = !modelFilms.length;
    play.disabled = slider.disabled = selection.mode === 'studio' && !animation;
    reset.disabled = false;
    slider.max = String(viewer.duration);
    document.querySelector('#active-model')!.textContent = model.name;
    document.querySelector('#active-experience')!.textContent = selection.mode === 'showcase' ? film.name : animation?.name ?? 'Inspection';
    document.querySelector('#film-name')!.textContent = film.name.toUpperCase();
    document.querySelector('#film-edition-name')!.textContent = film.edition.toUpperCase();
    document.querySelector('#chapter-total')!.textContent = String(film.chapters.length).padStart(2, '0');
    hint.textContent = selection.mode === 'showcase' ? `${viewer.duration}-second film · Drag timeline to explore` : 'Drag to orbit · Scroll to zoom';
    reset.setAttribute('aria-label', selection.mode === 'showcase' ? 'Restart animation' : 'Reset view');
    document.title = `${model.name} — ${selection.mode === 'showcase' ? film.name : 'Inspect'}`;
    const url = new URL(location.href);
    for (const [key, value] of Object.entries({ mode: selection.mode, model: model.id, animation: selection.animationId, showcase: film.id })) url.searchParams.set(key, value);
    history.replaceState(null, '', url);
    draw();
    if ((selection.mode === 'showcase' || autoplay) && !reducedMotion) start();
  } catch (error) {
    console.error(error);
    viewer?.dispose(); viewer = undefined;
    document.body.classList.remove('showcase');
    viewport.textContent = 'This item could not be opened. Choose another item from the library or reload.';
    play.disabled = reset.disabled = slider.disabled = true;
  }
}
const library = createLibrary(input => select(input, !!input.animationId));
play.addEventListener('click', () => playing ? pause() : start(), { signal: events.signal });
slider.addEventListener('input', () => { pause(); seconds = Number(slider.value); draw(); }, { signal: events.signal });
reset.addEventListener('click', () => { pause(); seconds = 0; viewer?.resetView(); draw(); }, { signal: events.signal });
filmButton.addEventListener('click', () => {
  const film = showcases.find(entry => entry.modelId === selection.modelId);
  if (film) select({ mode: 'showcase', showcaseId: film.id });
}, { signal: events.signal });
studioButton.addEventListener('click', () => select({ mode: 'studio' }), { signal: events.signal });
document.querySelector('#library-open')!.addEventListener('click', () => { pause(); resumeOnVisible = false; library.open(selection); }, { signal: events.signal });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { resumeOnVisible = playing; pause(); }
  else if (resumeOnVisible) { resumeOnVisible = false; start(); }
}, { signal: events.signal });
select(selection);
import.meta.hot?.dispose(() => { pause(); events.abort(); library.dispose(); viewer?.dispose(); });
