import { requireValue } from '../core/require-value';

/** Keep the clear showcase background in the URL across selection and reload. */
export function createBackgroundChoice(
  onChange: () => void,
  signal: AbortSignal,
) {
  const input = requireValue(
    document.querySelector<HTMLSelectElement>('#showcase-background'),
  );
  const url = new URL(location.href);
  input.value =
    url.searchParams.get('background') === 'f4fbff' ? 'f4fbff' : 'ffffff';
  const color = () => `#${input.value}`;
  const updateSurface = () =>
    document.body.style.setProperty('--showcase-background', color());
  updateSurface();
  input.addEventListener(
    'change',
    () => {
      updateSurface();
      const next = new URL(location.href);
      next.searchParams.set('background', input.value);
      history.replaceState(null, '', next);
      onChange();
    },
    { signal },
  );
  return color;
}
