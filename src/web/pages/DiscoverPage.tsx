import {useState, type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {
  getOpportunities,
  type InvestmentOpportunityListItem,
} from '../../api/investmentOpportunities';
import {getProperties, type MarketType, type PropertyListItem} from '../../api/properties';
import {AppImages} from '../../assets/images';
import {
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  ProgressBar,
  PropertyCard,
  StatusBadge,
  formatJod,
} from '../ui';
import {useAsyncData} from '../useAsyncData';

type BrowseMode = 'sale' | 'rent' | 'investment';

function OpportunityCard({item}: {item: InvestmentOpportunityListItem}) {
  return (
    <article className="property-card">
      <Link className="property-card__image" to={`/app/opportunity/${item.id}`}>
        <img src={AppImages.property.investment.opportunityHero} alt="" loading="lazy" />
        <StatusBadge status={item.trustBadge || item.status} />
      </Link>
      <div className="property-card__content">
        <div className="property-card__meta">
          <span>{item.assetClass}</span>
          <span>{item.riskBand} risk</span>
        </div>
        <Link to={`/app/opportunity/${item.id}`}><h3>{item.title}</h3></Link>
        <p>⌖ {item.location}</p>
        <ProgressBar value={item.fundingProgress} />
        <div className="property-card__footer">
          <strong>{item.targetIrr}% <small>target IRR</small></strong>
          <span>From {formatJod(item.minimumInvestmentAmount)}</span>
        </div>
      </div>
    </article>
  );
}

export function DiscoverPage() {
  const [mode, setMode] = useState<BrowseMode>('sale');
  const [query, setQuery] = useState('');
  const [appliedQuery, setAppliedQuery] = useState('');
  const result = useAsyncData<
    | {kind: 'opportunities'; items: InvestmentOpportunityListItem[]}
    | {kind: 'properties'; items: PropertyListItem[]}
  >(
    async () => {
      if (mode === 'investment') {
        const response = await getOpportunities({search: appliedQuery, limit: 24});
        return {kind: 'opportunities', items: response.items};
      }
      const response = await getProperties({
        marketType: mode as MarketType,
        search: appliedQuery,
        limit: 24,
        verifiedOnly: true,
      });
      return {kind: 'properties', items: response.items};
    },
    [mode, appliedQuery],
  );

  function search(event: FormEvent) {
    event.preventDefault();
    setAppliedQuery(query.trim());
  }

  const propertyItems = result.data?.kind === 'properties'
    ? result.data.items
    : [];
  const opportunities = result.data?.kind === 'opportunities'
    ? result.data.items
    : [];

  return (
    <>
      <PageHeader
        eyebrow="Verified marketplace"
        title="Find your place in Jordan"
        description="Explore property records reviewed for ownership, identity, and listing quality."
        action={<Link className="button button--secondary" to="/app/notifications">Notifications</Link>}
      />
      <section className="hero-search">
        <div className="segmented-control" aria-label="Market type">
          {(['sale', 'rent', 'investment'] as const).map(value => (
            <button
              className={mode === value ? 'active' : ''}
              key={value}
              onClick={() => setMode(value)}
              type="button">
              {value === 'sale' ? 'Buy' : value === 'rent' ? 'Rent' : 'Invest'}
            </button>
          ))}
        </div>
        <form className="search-form" onSubmit={search}>
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search properties"
            onChange={event => setQuery(event.target.value)}
            placeholder="Search by city, neighborhood, or property"
            value={query}
          />
          <button className="button button--primary" type="submit">Search</button>
        </form>
        <div className="quick-filters">
          {['Amman', 'Irbid', 'Aqaba', 'Verified only'].map(filter => (
            <button
              key={filter}
              onClick={() => {
                const next = filter === 'Verified only' ? '' : filter;
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
          <h2>{mode === 'investment' ? 'Investment opportunities' : `${mode === 'sale' ? 'Homes for sale' : 'Homes for rent'}`}</h2>
        </div>
        <span>{mode === 'investment' ? opportunities.length : propertyItems.length} results</span>
      </section>
      {result.loading ? <LoadingState label="Loading verified records…" /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
      {!result.loading && !result.error && mode === 'investment' && !opportunities.length ? (
        <EmptyState title="No opportunities found" description="Try a broader search or check again soon." />
      ) : null}
      {!result.loading && !result.error && mode !== 'investment' && !propertyItems.length ? (
        <EmptyState title="No properties found" description="Try another location or market." />
      ) : null}
      <div className="card-grid">
        {mode === 'investment'
          ? opportunities.map(item => <OpportunityCard item={item} key={item.id} />)
          : propertyItems.map(item => <PropertyCard key={item.id} property={item} />)}
      </div>
    </>
  );
}
