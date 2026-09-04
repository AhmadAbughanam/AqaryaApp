import {useMemo, useState, type FormEvent} from 'react';
import {Link} from 'react-router-dom';
import {getMyProfile, type OwnedProfileProperty} from '../../api/profile';
import {ErrorState, PropertyCover, formatDate, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

type PortfolioView = 'all' | 'verified' | 'review';
type IconName = 'arrow' | 'building' | 'check' | 'clock' | 'document' | 'pin' | 'plus' | 'search';

function Icon({name}: {name: IconName}) {
  const line = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {name === 'plus' ? <path {...line} d="M12 5v14M5 12h14" /> : null}
      {name === 'search' ? <><circle {...line} cx="10.5" cy="10.5" r="6.5" /><path {...line} d="m15.5 15.5 4.5 4.5" /></> : null}
      {name === 'pin' ? <><path {...line} d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle {...line} cx="12" cy="10" r="2.5" /></> : null}
      {name === 'arrow' ? <path {...line} d="M5 12h14m-5-5 5 5-5 5" /> : null}
      {name === 'check' ? <path {...line} d="m5 12 4 4L19 6" /> : null}
      {name === 'clock' ? <><circle {...line} cx="12" cy="12" r="9" /><path {...line} d="M12 7v5l3 2" /></> : null}
      {name === 'document' ? <><path {...line} d="M6 3h8l4 4v14H6V3Z" /><path {...line} d="M14 3v5h5M9 13h6M9 17h6" /></> : null}
      {name === 'building' ? <><path {...line} d="M4 21h16M6 21V8h8v13M14 12h4v9M9 11h2M9 15h2" /></> : null}
    </svg>
  );
}

const viewMatches = (property: OwnedProfileProperty, view: PortfolioView) => {
  if (view === 'verified') return property.status === 'verified';
  if (view === 'review') return property.status !== 'verified';
  return true;
};

const statusLabel = (property: OwnedProfileProperty) => {
  if (property.status === 'verified') return 'Verified record';
  if (property.status === 'pending_verification') return 'Under review';
  return property.status.replaceAll('_', ' ');
};

const progressFor = (property: OwnedProfileProperty) => {
  if (property.recordStatus === 'sealed') return 100;
  if (property.verificationStatus === 'verified') return 75;
  if (property.identityVerificationStatus === 'verified') return 50;
  return 25;
};

export function MyPropertiesPage() {
  const result = useAsyncData(getMyProfile);
  const [view, setView] = useState<PortfolioView>('all');
  const [query, setQuery] = useState('');
  const properties = result.data?.ownedProperties ?? [];
  const verifiedCount = properties.filter(property => property.status === 'verified').length;
  const reviewCount = properties.length - verifiedCount;

  const visibleProperties = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return properties
      .filter(property => viewMatches(property, view))
      .filter(property => !normalized || `${property.title} ${property.location} ${property.propertyType} ${property.recordReference}`.toLowerCase().includes(normalized))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [properties, query, view]);

  return (
    <div className="myprops">
      <header className="myprops-titlebar">
        <div>
          <span className="eyebrow">Citizen portfolio</span>
          <h1>My properties</h1>
          <p>Your ownership records, verification status, and market actions in one place.</p>
        </div>
        <Link className="myprops-add" to="/app/sell"><Icon name="plus" />Create listing</Link>
      </header>

      {result.loading ? (
        <div aria-label="Loading your property portfolio" className="myprops-loading" role="status">
          <div className="myprops-loading__hero" />
          <div className="myprops-loading__cards"><span /><span /></div>
        </div>
      ) : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}

      {result.data ? (
        <>
          <section className="portfolio-hero">
            <div className="portfolio-hero__glow" />
            <div className="portfolio-hero__top">
              <div>
                <span className="portfolio-hero__kicker"><i />SANAD-linked portfolio</span>
                <span>Total recorded value</span>
                <strong>{formatJod(result.data.aggregates.totalOwnedValue)}</strong>
              </div>
              <span aria-hidden="true" className="portfolio-hero__seal">A</span>
            </div>
            <div className="portfolio-hero__stats">
              <div><strong>{properties.length}</strong><span>Owned records</span></div>
              <div><strong>{verifiedCount}</strong><span>Verified</span></div>
              <div><strong>{reviewCount}</strong><span>In review</span></div>
            </div>
            <p><Icon name="document" />Values reflect registered property records, not live market estimates.</p>
          </section>

          {reviewCount ? (
            <button className="portfolio-notice" onClick={() => setView('review')} type="button">
              <span className="portfolio-notice__icon"><Icon name="clock" /></span>
              <span><strong>{reviewCount} {reviewCount === 1 ? 'record is' : 'records are'} being reviewed</strong><small>We will notify you when verification moves forward.</small></span>
              <Icon name="arrow" />
            </button>
          ) : null}

          <section className="portfolio-listing">
            <div className="portfolio-listing__head">
              <div><span>Ownership records</span><h2>Your portfolio</h2></div>
              <small>{visibleProperties.length} of {properties.length}</small>
            </div>

            <div className="portfolio-tools">
              <form className="portfolio-search" onSubmit={(event: FormEvent) => event.preventDefault()} role="search">
                <Icon name="search" />
                <input aria-label="Search owned properties" onChange={event => setQuery(event.target.value)} placeholder="Search property or record" value={query} />
                {query ? <button aria-label="Clear search" onClick={() => setQuery('')} type="button">×</button> : null}
              </form>
              <div aria-label="Filter ownership records" className="portfolio-tabs" role="group">
                {([
                  {count: properties.length, label: 'All', value: 'all'},
                  {count: verifiedCount, label: 'Verified', value: 'verified'},
                  {count: reviewCount, label: 'In review', value: 'review'},
                ] as const).map(option => (
                  <button aria-pressed={view === option.value} className={view === option.value ? 'is-active' : ''} key={option.value} onClick={() => setView(option.value)} type="button">
                    {option.label}<span>{option.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {!properties.length ? (
              <div className="portfolio-empty">
                <span><Icon name="building" /></span>
                <h2>No linked property records</h2>
                <p>Properties connected from an authoritative source will appear here before they can be listed.</p>
                <Link className="button button--primary" to="/app/help">Get help connecting a record</Link>
              </div>
            ) : !visibleProperties.length ? (
              <div className="portfolio-empty portfolio-empty--compact">
                <span><Icon name="search" /></span>
                <h2>No matching records</h2>
                <p>Try another search or switch the status filter.</p>
                <button onClick={() => { setQuery(''); setView('all'); }} type="button">Show all properties</button>
              </div>
            ) : (
              <div className="portfolio-grid">
                {visibleProperties.map(property => {
                  const verified = property.status === 'verified';
                  const progress = progressFor(property);
                  return (
                    <article className="portfolio-card" key={property.id}>
                      <Link className="portfolio-card__media" to={`/app/property/${property.id}`}>
                        <PropertyCover property={property} />
                        <span className={verified ? 'portfolio-card__status is-verified' : 'portfolio-card__status is-review'}>
                          {verified ? <Icon name="check" /> : <Icon name="clock" />}{statusLabel(property)}
                        </span>
                        <span className="portfolio-card__market">{property.marketType === 'sale' ? 'For sale' : 'For rent'}</span>
                      </Link>

                      <div className="portfolio-card__body">
                        <div className="portfolio-card__kind"><span>{property.propertyType}</span>{property.areaSqm ? <span>{property.areaSqm} m²</span> : null}</div>
                        <h3><Link to={`/app/property/${property.id}`}>{property.title}</Link></h3>
                        <p className="portfolio-card__location"><Icon name="pin" />{property.location}</p>

                        <div className="portfolio-values">
                          <div><span>Recorded value</span><strong>{formatJod(property.propertyValue)}</strong></div>
                          <div><span>{property.marketType === 'rent' ? 'Monthly rent' : 'Asking price'}</span><strong>{formatJod(property.price)}{property.marketType === 'rent' ? <small>/mo</small> : null}</strong></div>
                        </div>

                        <div className="record-health">
                          <div className="record-health__head">
                            <span>Digital record</span>
                            <strong className={verified ? 'is-verified' : ''}>{verified ? 'Sealed' : 'Verification in progress'}</strong>
                          </div>
                          <div aria-label={`Record verification ${progress}% complete`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress} className="record-health__track" role="progressbar"><i style={{width: `${progress}%`}} /></div>
                          <div className="record-health__meta"><span>{property.recordReference}</span><time dateTime={property.updatedAt}>Updated {formatDate(property.updatedAt)}</time></div>
                        </div>

                        <footer className="portfolio-card__actions">
                          <Link className="portfolio-record-link" to={`/app/property/${property.id}`}>
                            {verified ? 'View record' : 'Track review'}<Icon name="arrow" />
                          </Link>
                          {property.canListForSale ? <Link className="portfolio-list-link" to={`/app/sell?source=${property.id}`}>Create listing</Link> : null}
                        </footer>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
