import { requireValue } from '../core/require-value';
import { animations, type Selection } from './catalog';

/** Only expose actions that belong to the inspected model. */
export function renderModelActions(
  selection: Selection,
  onSelect: (animationId: string) => void,
) {
  const container = requireValue(
    document.querySelector<HTMLElement>('#model-actions'),
  );
  const compatible = animations.filter((entry) =>
    entry.modelIds.includes(selection.modelId),
  );
  container.hidden = selection.mode !== 'studio' || compatible.length === 0;
  container.replaceChildren();
  for (const action of compatible) {
    const button = document.createElement('button');
    const active = selection.animationId === action.id;
    button.type = 'button';
    button.textContent = action.name;
    button.title = action.description;
    button.setAttribute('aria-pressed', String(active));
    button.addEventListener('click', () => onSelect(active ? '' : action.id));
    container.append(button);
  }
}
