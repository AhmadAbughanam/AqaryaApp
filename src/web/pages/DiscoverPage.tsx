import {useEffect, useMemo, useState, type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {
  getProperties,
  type GetPropertiesParams,
  type PropertyListItem,
} from '../../api/properties';
import {ErrorState, PropertyCover, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

type Mode = 'sale' | 'rent';
type Sort = 'newest' | 'price_asc' | 'price_desc';

const SORTS: {value: Sort; label: string}[] = [
  {value: 'newest', label: 'Newest first'},
  {value: 'price_asc', label: 'Price · low to high'},
  {value: 'price_desc', label: 'Price · high to low'},
];
const SORT_SHORT: Record<Sort, string> = {
  newest: 'Newest',
  price_asc: 'Price ↑',
  price_desc: 'Price ↓',
};

const CITIES = ['Amman', 'Umrah', 'Zarqa', 'Irbid', 'Aqaba'];
const TYPES = ['Apartment', 'Villa', 'Land', 'Commercial'];
const BEDS = [1, 2, 3, 4];
const PRICE_BANDS: Record<Mode, {label: string; value: number | null}[]> = {
  sale: [
    {label: 'Any', value: null},
    {label: '≤ 75K', value: 75_000},
    {label: '≤ 150K', value: 150_000},
    {label: '≤ 300K', value: 300_000},
    {label: '≤ 700K', value: 700_000},
  ],
  rent: [
    {label: 'Any', value: null},
    {label: '≤ 300', value: 300},
    {label: '≤ 500', value: 500},
    {label: '≤ 800', value: 800},
    {label: '≤ 1200', value: 1200},
  ],
};

const priceChipLabel = (mode: Mode, max: number) =>
  mode === 'rent'
    ? `≤ ${max}/mo`
    : `≤ ${max >= 1000 ? `${Math.round(max / 1000)}K` : max}`;

interface Filters {
  city: string | null;
  type: string | null;
  beds: number | null;
  maxPrice: number | null;
  verifiedOnly: boolean;
}
const EMPTY_FILTERS: Filters = {city: null, type: null, beds: null, maxPrice: null, verifiedOnly: true};

export function DiscoverPage() {
  const [mode, setMode] = useState<Mode>('sale');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [saved, setSaved] = useState<Set<string>>(new Set());

  useEffect(() => {
    const id = setTimeout(() => setAppliedQuery(query.trim()), 280);
    return () => clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (!sheetOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [sheetOpen]);

  const params: GetPropertiesParams = useMemo(
    () => ({
      marketType: mode,
      search: appliedQuery || undefined,
      city: filters.city ?? undefined,
      propertyType: filters.type ?? undefined,
      bedrooms: filters.beds ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      verifiedOnly: filters.verifiedOnly,
      sort,
      limit: 60,
    }),
    [mode, appliedQuery, filters, sort],
  );

  const result = useAsyncData<PropertyListItem[]>(
    async () => (await getProperties(params)).items,
    [params],
  );
  const items = result.data ?? [];

  function patch(next: Partial<Filters>) {
    setFilters(current => ({...current, ...next}));
  }
  function switchMode(next: Mode) {
    setMode(next);
    patch({maxPrice: null});
  }
  function resetAll() {
    setFilters(EMPTY_FILTERS);
    setQuery('');
    setAppliedQuery('');
  }
  function toggleSave(id: string) {
    setSaved(current => {
      const nextSet = new Set(current);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  }

  const activeCount =
    (filters.city ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.beds ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.verifiedOnly ? 0 : 1);
  const dirty = activeCount > 0 || Boolean(appliedQuery);

  const noun = mode === 'sale' ? (items.length === 1 ? 'home' : 'homes') : items.length === 1 ? 'rental' : 'rentals';

  return (
    <div className="dsc">
      <div className="dsc__bar">
        <form
          className="dsc-search"
          onSubmit={(event: FormEvent) => {
            event.preventDefault();
            setAppliedQuery(query.trim());
          }}
          role="search">
          <span className="dsc-search__icon" aria-hidden="true">⌕</span>
          <input
            aria-label="Search properties"
            enterKeyHint="search"
            onChange={event => setQuery(event.target.value)}
            placeholder="Search city, area, or property"
            value={query}
          />
          {query ? (
            <button aria-label="Clear search" className="dsc-search__clear" onClick={() => setQuery('')} type="button">
              ×
            </button>
          ) : null}
        </form>

        <div className="dsc__controls">
          <div className="segmented-control" aria-label="Market type">
            {(['sale', 'rent'] as const).map(value => (
              <button className={mode === value ? 'active' : ''} key={value} onClick={() => switchMode(value)} type="button">
                {value === 'sale' ? 'Buy' : 'Rent'}
              </button>
            ))}
          </div>

          <button
            aria-label="Filters"
            className={activeCount ? 'dsc-iconbtn has-count' : 'dsc-iconbtn'}
            onClick={() => setSheetOpen(true)}
            type="button">
            <span aria-hidden="true">⚙</span>
            {activeCount ? <b>{activeCount}</b> : null}
          </button>

          <div className="dsc-sortwrap">
            <button
              aria-expanded={sortOpen}
              aria-label="Sort"
              className="dsc-iconbtn dsc-iconbtn--wide"
              onClick={() => setSortOpen(open => !open)}
              type="button">
              <span aria-hidden="true">↕</span>
              {SORT_SHORT[sort]}
            </button>
            {sortOpen ? (
              <>
                <button className="dsc-menu__scrim" aria-hidden="true" tabIndex={-1} onClick={() => setSortOpen(false)} type="button" />
                <div className="dsc-menu" role="menu">
                  {SORTS.map(option => (
                    <button
                      className={sort === option.value ? 'is-active' : ''}
                      key={option.value}
                      onClick={() => {
                        setSort(option.value);
                        setSortOpen(false);
                      }}
                      role="menuitemradio"
                      aria-checked={sort === option.value}
                      type="button">
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="dsc-rail">
        <button
          className={filters.verifiedOnly ? 'dsc-tag is-active' : 'dsc-tag'}
          onClick={() => patch({verifiedOnly: !filters.verifiedOnly})}
          type="button">
          ✓ Verified only
        </button>
        {filters.city ? (
          <button className="dsc-tag is-set" onClick={() => patch({city: null})} type="button">
            {filters.city} <span aria-hidden="true">×</span>
          </button>
        ) : null}
        {filters.type ? (
          <button className="dsc-tag is-set" onClick={() => patch({type: null})} type="button">
            {filters.type} <span aria-hidden="true">×</span>
          </button>
        ) : null}
        {filters.beds ? (
          <button className="dsc-tag is-set" onClick={() => patch({beds: null})} type="button">
            {filters.beds}+ bd <span aria-hidden="true">×</span>
          </button>
        ) : null}
        {filters.maxPrice ? (
          <button className="dsc-tag is-set" onClick={() => patch({maxPrice: null})} type="button">
            {priceChipLabel(mode, filters.maxPrice)} <span aria-hidden="true">×</span>
          </button>
        ) : null}
        {activeCount === 0
          ? CITIES.slice(0, 4).map(city => (
              <button className="dsc-tag" key={city} onClick={() => patch({city})} type="button">
                {city}
              </button>
            ))
          : null}
      </div>

      <div className="dsc-summary">
        <span>
          <strong>{result.loading ? '—' : items.length}</strong> verified {noun} {mode === 'sale' ? 'for sale' : 'to rent'}
          {filters.city ? ` in ${filters.city}` : ''}
          {appliedQuery ? ` · “${appliedQuery}”` : ''}
        </span>
        {dirty ? (
          <button className="dsc-summary__reset" onClick={resetAll} type="button">
            Reset
          </button>
        ) : null}
      </div>

      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}

      {result.loading ? (
        <div className="dsc-list">
          {[0, 1, 2, 3].map(i => (
            <div className="dcard-skel" key={i}>
              <div className="dcard-skel__media" />
              <div className="dcard-skel__lines">
                <span /> <span /> <span />
              </div>
            </div>
          ))}
        </div>
      ) : !result.error && !items.length ? (
        <div className="dsc-empty">
          <span aria-hidden="true">⌂</span>
          <strong>Nothing matches these filters</strong>
          <p>Widen the price, area, or property type.</p>
          <button className="button button--secondary" onClick={resetAll} type="button">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="dsc-list">
          {items.map(property => {
            const rent = property.marketType === 'rent';
            const isSaved = saved.has(property.id);
            return (
              <article className="dcard" key={property.id}>
                <Link className="dcard__link" to={`/app/property/${property.id}`}>
                  <div className="dcard__media">
                    <PropertyCover property={property} />
                    {property.verificationStatus === 'verified' ? (
                      <span className="dcard__vbadge"><i />Verified</span>
                    ) : null}
                  </div>
                  <div className="dcard__body">
                    <div className="dcard__top">
                      <strong className="dcard__price">
                        {formatJod(property.price)}
                        {rent ? <span>/mo</span> : null}
                      </strong>
                      <span className="dcard__type">{property.propertyType}</span>
                    </div>
                    <h3>{property.title}</h3>
                    <p className="dcard__loc">⌖ {property.location}</p>
                    <div className="dcard__specs">
                      {property.bedrooms ? <span>{property.bedrooms} bd</span> : null}
                      {property.bathrooms ? <span>{property.bathrooms} ba</span> : null}
                      {property.areaSqm ? <span>{property.areaSqm} m²</span> : null}
                    </div>
                  </div>
                </Link>
                <button
                  aria-label={isSaved ? 'Remove from saved' : 'Save property'}
                  aria-pressed={isSaved}
                  className={isSaved ? 'dcard__save is-on' : 'dcard__save'}
                  onClick={() => toggleSave(property.id)}
                  type="button">
                  {isSaved ? '♥' : '♡'}
                </button>
              </article>
            );
          })}
        </div>
      )}

      <FilterSheet
        open={sheetOpen}
        mode={mode}
        filters={filters}
        count={items.length}
        loading={result.loading}
        onClose={() => setSheetOpen(false)}
        onPatch={patch}
        onReset={() => setFilters(EMPTY_FILTERS)}
      />
    </div>
  );
}

function FilterSheet({
  open,
  mode,
  filters,
  count,
  loading,
  onClose,
  onPatch,
  onReset,
}: {
  open: boolean;
  mode: Mode;
  filters: Filters;
  count: number;
  loading: boolean;
  onClose: () => void;
  onPatch: (next: Partial<Filters>) => void;
  onReset: () => void;
}) {
  return (
    <div className={open ? 'fsheet is-open' : 'fsheet'} aria-hidden={!open}>
      <button className="fsheet__scrim" aria-label="Close filters" onClick={onClose} type="button" />
      <div className="fsheet__panel" role="dialog" aria-label="Filters" aria-modal="true">
        <div className="fsheet__grip" />
        <header className="fsheet__head">
          <h2>Filters</h2>
          <button className="text-button" onClick={onReset} type="button">Reset all</button>
        </header>

        <div className="fsheet__body">
          <section>
            <span className="fsheet__label">Max price</span>
            <div className="fsheet__chips">
              {PRICE_BANDS[mode].map(band => (
                <button
                  className={filters.maxPrice === band.value ? 'fchip is-active' : 'fchip'}
                  key={band.label}
                  onClick={() => onPatch({maxPrice: band.value})}
                  type="button">
                  {band.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <span className="fsheet__label">Bedrooms</span>
            <div className="fsheet__chips">
              <button className={!filters.beds ? 'fchip is-active' : 'fchip'} onClick={() => onPatch({beds: null})} type="button">
                Any
              </button>
              {BEDS.map(bed => (
                <button
                  className={filters.beds === bed ? 'fchip is-active' : 'fchip'}
                  key={bed}
                  onClick={() => onPatch({beds: bed})}
                  type="button">
                  {bed}
                  {bed === 4 ? '+' : ''}
                </button>
              ))}
            </div>
          </section>

          <section>
            <span className="fsheet__label">Property type</span>
            <div className="fsheet__chips">
              <button className={!filters.type ? 'fchip is-active' : 'fchip'} onClick={() => onPatch({type: null})} type="button">
                Any
              </button>
              {TYPES.map(type => (
                <button
                  className={filters.type === type ? 'fchip is-active' : 'fchip'}
                  key={type}
                  onClick={() => onPatch({type})}
                  type="button">
                  {type}
                </button>
              ))}
            </div>
          </section>

          <section>
            <span className="fsheet__label">City</span>
            <div className="fsheet__chips">
              <button className={!filters.city ? 'fchip is-active' : 'fchip'} onClick={() => onPatch({city: null})} type="button">
                Any
              </button>
              {CITIES.map(city => (
                <button
                  className={filters.city === city ? 'fchip is-active' : 'fchip'}
                  key={city}
                  onClick={() => onPatch({city})}
                  type="button">
                  {city}
                </button>
              ))}
            </div>
          </section>

          <div className="fsheet__toggle">
            <div>
              <strong>Verified only</strong>
              <span>Source-authenticated records</span>
            </div>
            <button
              aria-pressed={filters.verifiedOnly}
              className={filters.verifiedOnly ? 'switch active' : 'switch'}
              onClick={() => onPatch({verifiedOnly: !filters.verifiedOnly})}
              type="button">
              <i />
            </button>
          </div>
        </div>

        <footer className="fsheet__foot">
          <button className="button button--primary button--wide" onClick={onClose} type="button">
            {loading ? 'Updating…' : `Show ${count} ${count === 1 ? 'result' : 'results'}`}
          </button>
        </footer>
      </div>
    </div>
  );
}
