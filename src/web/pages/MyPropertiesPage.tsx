import {Link} from 'react-router-dom';
import {getMyProfile} from '../../api/profile';
import {EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, formatJod, propertyImage} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function MyPropertiesPage() {
  const result = useAsyncData(getMyProfile);
  return (
    <>
      <PageHeader
        title="My properties"
        action={<Link className="button button--primary" to="/app/sell">List a property</Link>}
      />
      {result.loading ? <LoadingState /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
      {result.data && !result.data.ownedProperties.length ? <EmptyState title="No properties yet" description="Purchased and registered properties will appear here." /> : null}
      <div className="record-list">
        {result.data?.ownedProperties.map(property => (
          <article className="owned-card" key={property.id}>
            <img src={propertyImage({marketType: property.marketType, imageUrls: property.imageUrls})} alt="" />
            <div><div className="property-card__meta"><StatusBadge status={property.status} /><span>{property.marketType}</span></div><h3>{property.title}</h3><p>{property.location}</p></div>
            <div className="owned-card__value"><span>Recorded value</span><strong>{formatJod(property.propertyValue)}</strong></div>
            <div className="row-actions">
              <Link className="button button--secondary" to={`/app/property/${property.id}`}>View record</Link>
              {property.canListForSale ? <Link className="button button--primary" to={`/app/sell?source=${property.id}`}>List for sale</Link> : null}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
