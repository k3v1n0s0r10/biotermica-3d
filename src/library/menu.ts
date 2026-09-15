import { animations, models, showcases, type Selection } from './catalog';

type Category = 'models' | 'showcases' | 'animations';
export function createLibrary(onSelect: (selection: Partial<Selection>) => void) {
  const dialog = document.querySelector<HTMLDialogElement>('#library-dialog')!;
  const cards = document.querySelector<HTMLElement>('#library-cards')!;
  const search = document.querySelector<HTMLInputElement>('#library-search')!;
  const tabs = [...document.querySelectorAll<HTMLButtonElement>('[data-category]')];
  const title = document.querySelector<HTMLElement>('#library-category-title')!;
  const count = document.querySelector<HTMLElement>('#library-count')!;
  const events = new AbortController();
  let category: Category = 'models';
  let current: Selection;
  function render() {
    cards.replaceChildren();
    const entries = category === 'models' ? models : category === 'showcases' ? showcases : animations;
    const matches = entries.filter(entry => `${entry.name} ${entry.description}`.toLowerCase().includes(search.value.toLowerCase()));
    title.textContent = ({ models: 'Modelos', showcases: 'Presentaciones', animations: 'Animaciones' })[category];
    count.textContent = `${matches.length} ${matches.length === 1 ? 'elemento' : 'elementos'}`;
    tabs.forEach(tab => tab.setAttribute('aria-pressed', String(tab.dataset.category === category)));
    for (const entry of matches) {
      const card = document.createElement('button');
      card.type = 'button'; card.className = 'library-card';
      const selected = category === 'models' ? current.modelId === entry.id : category === 'showcases' ? current.mode === 'showcase' && current.showcaseId === entry.id : current.mode === 'studio' && current.animationId === entry.id;
      card.setAttribute('aria-pressed', String(selected));
      const artwork = document.createElement('span'); artwork.className = `card-art ${category}`;
      artwork.setAttribute('aria-hidden', 'true'); artwork.textContent = category === 'models' ? '▧' : category === 'showcases' ? '▷' : '↻';
      const meta = document.createElement('span'); meta.className = 'card-meta';
      meta.textContent = category === 'models' ? models.find(model => model.id === entry.id)!.version : `${'duration' in entry ? entry.duration : ''} s · ${category === 'showcases' ? 'Presentación' : 'Estudio de movimiento'}`;
      const heading = document.createElement('strong'); heading.textContent = entry.name;
      const description = document.createElement('span'); description.className = 'card-description'; description.textContent = entry.description;
      const action = document.createElement('span'); action.className = 'card-action'; action.textContent = category === 'models' ? 'Inspeccionar modelo ↗' : category === 'showcases' ? 'Ver presentación ↗' : 'Reproducir animación ↗';
      card.append(artwork, meta, heading, description, action);
      card.addEventListener('click', () => {
        dialog.close();
        if (category === 'models') onSelect({ mode: 'studio', modelId: entry.id });
        else if (category === 'showcases') onSelect({ mode: 'showcase', showcaseId: entry.id });
        else {
          const animation = animations.find(item => item.id === entry.id)!;
          onSelect({ mode: 'studio', animationId: animation.id, modelId: animation.modelIds.includes(current.modelId) ? current.modelId : animation.modelIds[0] });
        }
      });
      cards.append(card);
    }
    if (!matches.length) {
      const empty = document.createElement('p'); empty.className = 'library-empty'; empty.textContent = 'Sin resultados. Prueba otra búsqueda.'; cards.append(empty);
    }
  }
  tabs.forEach(tab => tab.addEventListener('click', () => { category = tab.dataset.category as Category; search.value = ''; render(); }, { signal: events.signal }));
  search.addEventListener('input', render, { signal: events.signal });
  document.querySelector('#library-close')!.addEventListener('click', () => dialog.close(), { signal: events.signal });
  for (const [key, entries] of Object.entries({ models, showcases, animations })) {
    document.querySelector(`[data-count="${key}"]`)!.textContent = String(entries.length).padStart(2, '0');
  }
  return {
    open(selection: Selection) { current = selection; search.value = ''; render(); dialog.showModal(); },
    dispose() { events.abort(); dialog.close(); },
  };
}
