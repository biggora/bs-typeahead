import { Typeahead } from '@bs-typeahead/react';
import { useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { allCities, mockFetcher, type City } from '../mock-server.js';

const CODE = `import { Typeahead } from '@bs-typeahead/react';

function CityPicker() {
  const [selected, setSelected] = useState<City | null>(null);
  return (
    <>
      <Typeahead<City>
        source={allCities}
        displayField="name"
        valueField="id"
        placeholder="Search cities..."
        className="form-control"
        onSelect={(detail) => setSelected(detail.item)}
      />
      {selected && <div className="alert alert-success">{selected.name}</div>}
    </>
  );
}`;

function CityPicker(): React.ReactElement {
  const [selectedLocal, setSelectedLocal] = useState<City | null>(null);
  const [selectedAsync, setSelectedAsync] = useState<City | null>(null);

  return (
    <div className="row g-3">
      <div className="col-md-6">
        <h4 className="h6">Local source</h4>
        <Typeahead<City>
          source={allCities}
          displayField="name"
          valueField="id"
          placeholder="Search cities (local)..."
          className="form-control"
          onSelect={(detail) => setSelectedLocal(detail.item)}
        />
        {selectedLocal && (
          <div className="alert alert-success mt-2 mb-0">
            Selected #{selectedLocal.id}: {selectedLocal.name}
          </div>
        )}
      </div>

      <div className="col-md-6">
        <h4 className="h6">Async fetcher</h4>
        <Typeahead<City>
          source={mockFetcher(250)}
          displayField="name"
          valueField="id"
          placeholder="Search cities (async)..."
          className="form-control"
          minLength={1}
          debounceMs={200}
          onSelect={(detail) => setSelectedAsync(detail.item)}
        />
        {selectedAsync && (
          <div className="alert alert-success mt-2 mb-0">
            Selected #{selectedAsync.id}: {selectedAsync.name}
          </div>
        )}
      </div>
    </div>
  );
}

export function init(container: HTMLElement): () => void {
  const h2 = document.createElement('h2');
  h2.textContent = 'Demo #9 — React wrapper';
  container.append(h2);

  const reactHost = document.createElement('div');
  container.append(reactHost);

  const pre = document.createElement('pre');
  pre.className = 'code-sample mt-3';
  pre.append(document.createTextNode(CODE));
  container.append(pre);

  let root: Root | null = createRoot(reactHost);
  root.render(<CityPicker />);

  return (): void => {
    root?.unmount();
    root = null;
  };
}
