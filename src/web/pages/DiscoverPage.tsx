import {useEffect, useState, type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {getProperties, type MarketType, type PropertyListItem} from '../../api/properties';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PropertyCard,
} from '../ui';
import {useAsyncData} from '../useAsyncData';

type BrowseMode = Extract<MarketType, 'sale' | 'rent'>;

const CITY_CHIPS = ['Amman', 'Umrah', 'Zarqa'] as const;

export function DiscoverPage() {
  const [mode, setMode] = useState<BrowseMode>('sale');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  // Debounced live search; Enter applies immediately via the form.
  useEffect(() => {
    const id = setTimeout(() => setAppliedQuery(query.trim()), 300);
    return () => clearTimeout(id);
  }, [query]);

  const result = useAsyncData<PropertyListItem[]>(async () => {
    const response = await getProperties({
      marketType: mode,
      search: appliedQuery,
      limit: 24,
      verifiedOnly: true,
    });
    return response.items;
  }, [mode, appliedQuery]);

  function applyNow(event: FormEvent) {
    event.preventDefault();
    setAppliedQuery(query.trim());
  }

  const items = result.data ?? [];
  const activeChip = appliedQuery.toLowerCase();

  return (
    <>
      <PageHeader
        eyebrow="Source-authenticated"
        title="Find a verified property"
        action={<Link className="button button--secondary" to="/app/notifications">Alerts</Link>}
      />

      <div className="discover-search">
        <form className="search-field" onSubmit={applyNow} role="search">
          <span className="search-field__icon" aria-hidden="true">⌕</span>
          <input
            aria-label="Search properties"
            enterKeyHint="search"
            onChange={event => setQuery(event.target.value)}
            placeholder="City, area, or property"
            value={query}
          />
          {query ? (
            <button
              aria-label="Clear search"
              className="search-field__clear"
              onClick={() => setQuery('')}
              type="button">
              ×
            </button>
          ) : null}
        </form>

        <div className="segmented-control" aria-label="Market type">
          {(['sale', 'rent'] as const).map(value => (
            <button
              className={mode === value ? 'active' : ''}
              key={value}
              onClick={() => setMode(value)}
              type="button">
              {value === 'sale' ? 'Buy' : 'Rent'}
            </button>
          ))}
        </div>

        <div className="chip-row">
          {CITY_CHIPS.map(city => {
            const on = activeChip === city.toLowerCase();
            return (
              <button
                className={on ? 'chip is-active' : 'chip'}
                key={city}
                onClick={() => setQuery(on ? '' : city)}
                type="button">
                {city}
              </button>
            );
          })}
        </div>
      </div>

      <section className="section-heading">
        <div>
          <span className="eyebrow">{appliedQuery ? `Results for “${appliedQuery}”` : 'Curated for you'}</span>
          <h2>{mode === 'sale' ? 'Homes & plots for sale' : 'Homes for rent'}</h2>
        </div>
        <span>{items.length} {items.length === 1 ? 'result' : 'results'}</span>
      </section>

      {result.loading ? <LoadingState label="Loading verified records…" /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
      {!result.loading && !result.error && !items.length ? (
        <EmptyState title="No properties found" description="Try another location or market." />
      ) : null}
      <div className="card-grid">
        {items.map(item => <PropertyCard key={item.id} property={item} />)}
      </div>
    </>
  );
}
