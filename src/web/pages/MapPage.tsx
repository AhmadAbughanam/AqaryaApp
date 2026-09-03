import {Link} from 'react-router-dom';
import {getProperties, type PropertyListItem} from '../../api/properties';
import {AppImages} from '../../assets/images';
import {ErrorState, LoadingState, PageHeader, StatusBadge, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function MapPage() {
  const result = useAsyncData(async () => {
    const [sale, rent] = await Promise.all([
      getProperties({marketType: 'sale', limit: 50}),
      getProperties({marketType: 'rent', limit: 50}),
    ]);
    return [...sale.items, ...rent.items].filter(item => item.latitude && item.longitude);
  });

  return (
    <>
      <PageHeader eyebrow="Location explorer" title="Property map" description="Browse verified records with registered coordinates across Jordan." />
      {result.loading ? <LoadingState label="Loading map records…" /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
      {result.data ? (
        <div className="map-layout">
          <div className="map-canvas" style={{backgroundImage: `url(${AppImages.backgrounds.jordanMap})`}}>
            <div className="map-canvas__wash" />
            <div className="map-canvas__label">
              <span className="eyebrow">Jordan coverage</span>
              <strong>{result.data.length} geolocated records</strong>
              <p>Select a listing to inspect its verified location and property details.</p>
            </div>
          </div>
          <div className="map-list">
            {result.data.map((property: PropertyListItem) => (
              <Link className="map-result" key={property.id} to={`/app/property/${property.id}`}>
                <div><StatusBadge status={property.marketType} /><h3>{property.title}</h3><p>{property.location}</p></div>
                <strong>{formatJod(property.price)}</strong>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
