import {useState, type FormEvent} from 'react';
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

export function DiscoverPage() {
  const [mode, setMode] = useState<BrowseMode>('sale');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');

  const result = useAsyncData<PropertyListItem[]>(async () => {
    const response = await getProperties({
      marketType: mode,
      search: appliedQuery,
      limit: 24,
      verifiedOnly: true,
    });
    return response.items;
  }, [mode, appliedQuery]);

  function search(event: FormEvent) {
    event.preventDefault();
    setAppliedQuery(query.trim());
  }

  const items = result.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Source-authenticated"
        title="Verified listings in Umrah & Jordan"
        description="Every listing here is tied to an authoritative source and checked for ownership and identity before it is published."
        action={<Link className="button button--secondary" to="/app/notifications">Notifications</Link>}
      />
      <section className="hero-search">
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
        <form className="search-form" onSubmit={search}>
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search properties"
            onChange={event => setQuery(event.target.value)}
            placeholder="Search by city, area, or property"
            value={query}
          />
          <button className="button button--primary" type="submit">Search</button>
        </form>
        <div className="quick-filters">
          {['Amman', 'Umrah', 'Zarqa', 'Reset'].map(filter => (
            <button
              key={filter}
              onClick={() => {
                const next = filter === 'Reset' ? '' : filter;
                setQuery(next);
                setAppliedQuery(next);
              }}
              type="button">
              {filter}
            </button>
          ))}
        </div>
      </section>
      <section className="section-heading">
        <div>
          <span className="eyebrow">Curated for you</span>
          <h2>{mode === 'sale' ? 'Homes & plots for sale' : 'Homes for rent'}</h2>
        </div>
        <span>{items.length} results</span>
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
