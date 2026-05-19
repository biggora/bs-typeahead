import 'bootstrap/dist/css/bootstrap.min.css';
import '@bs-typeahead/core/styles.css';
import './styles.css';

interface ScenarioModule {
  init(container: HTMLElement): void | (() => void) | Promise<void | (() => void)>;
}

interface ScenarioEntry {
  slug: string;
  title: string;
  load: () => Promise<ScenarioModule>;
}

const scenarios: ScenarioEntry[] = [
  {
    slug: '01',
    title: '#1 Local objects',
    load: () => import('./scenarios/01-local-objects.js'),
  },
  {
    slug: '02',
    title: '#2 Custom fields',
    load: () => import('./scenarios/02-custom-fields.js'),
  },
  {
    slug: '03',
    title: '#3 displayField only',
    load: () => import('./scenarios/03-display-field.js'),
  },
  {
    slug: '04',
    title: '#4 Async fetcher',
    load: () => import('./scenarios/04-fetcher-simple.js'),
  },
  {
    slug: '05',
    title: '#5 Async + minLength',
    load: () => import('./scenarios/05-fetcher-post.js'),
  },
  {
    slug: '06',
    title: '#6 Local strings',
    load: () => import('./scenarios/06-local-strings.js'),
  },
  {
    slug: '07',
    title: '#7 Long list + maxHeight',
    load: () => import('./scenarios/07-scroll-many.js'),
  },
  {
    slug: '08',
    title: '#8 autoSelect=false',
    load: () => import('./scenarios/08-no-auto-select.js'),
  },
  {
    slug: '09',
    title: '#9 React wrapper',
    load: () => import('./scenarios/09-react-demo.js'),
  },
  {
    slug: '10',
    title: '#10 A11y showcase',
    load: () => import('./scenarios/10-a11y-showcase.js'),
  },
];

const slugById = new Map(scenarios.map((s) => [s.slug, s]));

let activeCleanup: (() => void) | null = null;

function buildNav(container: HTMLElement, activeSlug: string): void {
  const nav = document.createElement('div');
  nav.className = 'scenario-nav';
  const inner = document.createElement('div');
  inner.className = 'container d-flex flex-wrap gap-3';
  for (const s of scenarios) {
    const a = document.createElement('a');
    a.href = `#/${s.slug}`;
    a.textContent = s.title;
    if (s.slug === activeSlug) a.classList.add('active');
    inner.append(a);
  }
  nav.append(inner);
  container.append(nav);
}

async function render(): Promise<void> {
  const root = document.getElementById('root');
  if (!root) return;

  const raw = window.location.hash.replace(/^#\//, '');
  const slug = slugById.has(raw) ? raw : '01';
  const entry = slugById.get(slug);
  if (!entry) return;

  activeCleanup?.();
  activeCleanup = null;
  root.replaceChildren();

  buildNav(root, slug);

  const main = document.createElement('main');
  main.className = 'container';
  root.append(main);

  try {
    const mod = await entry.load();
    const result = await mod.init(main);
    if (typeof result === 'function') activeCleanup = result;
  } catch (err) {
    const errorBox = document.createElement('div');
    errorBox.className = 'alert alert-danger';
    errorBox.textContent = `Failed to load scenario "${slug}": ${(err as Error).message}`;
    main.append(errorBox);
  }
}

window.addEventListener('hashchange', () => {
  void render();
});
window.addEventListener('DOMContentLoaded', () => {
  void render();
});
