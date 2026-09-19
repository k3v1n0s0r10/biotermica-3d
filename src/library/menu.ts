import { requireValue } from '../core/require-value';
import { models, type Selection, showcases } from './catalog';

type LibraryEntry = (typeof models)[number] | (typeof showcases)[number];
type Category = 'models' | 'showcases';
function resultCount(count: number) {
  return `${count} ${count === 1 ? 'elemento' : 'elementos'}`;
}
export function createLibrary(
  onSelect: (selection: Partial<Selection>) => void,
) {
  const dialog = requireValue(
    document.querySelector<HTMLDialogElement>('#library-dialog'),
  );
  const cards = requireValue(
    document.querySelector<HTMLElement>('#library-cards'),
  );
  const search = requireValue(
    document.querySelector<HTMLInputElement>('#library-search'),
  );
  const tabs = [
    ...document.querySelectorAll<HTMLButtonElement>('[data-category]'),
  ];
  const title = requireValue(
    document.querySelector<HTMLElement>('#library-category-title'),
  );
  const count = requireValue(
    document.querySelector<HTMLElement>('#library-count'),
  );
  const events = new AbortController();
  let category: Category = 'models';
  let current: Selection;
  function isSelected(id: string) {
    const selectedIds = {
      models: current.modelId,
      showcases: current.mode === 'showcase' ? current.showcaseId : '',
    };
    return selectedIds[category] === id;
  }
  function selectEntry(id: string) {
    dialog.close();
    if (category === 'models')
      onSelect({ mode: 'studio', modelId: id, animationId: '' });
    else onSelect({ mode: 'showcase', showcaseId: id, animationId: '' });
  }
  function entryMetadata(entry: LibraryEntry) {
    return category === 'models'
      ? requireValue(models.find((model) => model.id === entry.id)).version
      : `${'duration' in entry ? entry.duration : ''} s · Presentación`;
  }
  function createCard(entry: LibraryEntry) {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'library-card';
    card.setAttribute('aria-pressed', String(isSelected(entry.id)));
    const artwork = document.createElement('span');
    artwork.className = `card-art ${category}`;
    artwork.setAttribute('aria-hidden', 'true');
    artwork.textContent = { models: '▧', showcases: '▷' }[category];
    const meta = document.createElement('span');
    meta.className = 'card-meta';
    meta.textContent = entryMetadata(entry);
    const heading = document.createElement('strong');
    heading.textContent = entry.name;
    const description = document.createElement('span');
    description.className = 'card-description';
    description.textContent = entry.description;
    const action = document.createElement('span');
    action.className = 'card-action';
    action.textContent = {
      models: 'Inspeccionar modelo ↗',
      showcases: 'Ver presentación ↗',
    }[category];
    card.append(artwork, meta, heading, description, action);
    card.addEventListener('click', () => selectEntry(entry.id));
    return card;
  }
  function render() {
    cards.replaceChildren();
    const entries = { models, showcases }[category];
    const matches = entries.filter((entry) =>
      `${entry.name} ${entry.description}`
        .toLowerCase()
        .includes(search.value.toLowerCase()),
    );
    title.textContent = {
      models: 'Modelos',
      showcases: 'Presentaciones',
    }[category];
    count.textContent = resultCount(matches.length);
    for (const tab of tabs) {
      tab.setAttribute(
        'aria-pressed',
        String(tab.dataset.category === category),
      );
    }
    for (const entry of matches) cards.append(createCard(entry));
    if (!matches.length) renderEmpty();
  }
  function renderEmpty() {
    const empty = document.createElement('p');
    empty.className = 'library-empty';
    empty.textContent = 'Sin resultados. Prueba otra búsqueda.';
    cards.append(empty);
  }
  for (const tab of tabs) {
    tab.addEventListener(
      'click',
      () => {
        category =
          tab.dataset.category === 'showcases' ? 'showcases' : 'models';
        search.value = '';
        render();
      },
      { signal: events.signal },
    );
  }
  search.addEventListener('input', render, { signal: events.signal });
  requireValue(document.querySelector('#library-close')).addEventListener(
    'click',
    () => dialog.close(),
    { signal: events.signal },
  );
  for (const [key, entries] of Object.entries({
    models,
    showcases,
  })) {
    requireValue(document.querySelector(`[data-count="${key}"]`)).textContent =
      String(entries.length).padStart(2, '0');
  }
  return {
    open(selection: Selection) {
      current = selection;
      search.value = '';
      render();
      dialog.showModal();
    },
    dispose() {
      events.abort();
      dialog.close();
    },
  };
}
