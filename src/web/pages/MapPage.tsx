import {useMemo, useState} from 'react';
import {Link} from 'react-router-dom';
import {getProperties, type PropertyListItem} from '../../api/properties';
import {ErrorState, LoadingState, PageHeader, StatusBadge, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

// Equirectangular projection over a padded Jordan bounding box.
const BOX = {lngMin: 34.8, lngMax: 39.4, latMin: 29.1, latMax: 33.5};
const VIEW_W = 460;
const VIEW_H = 420;

const projectX = (lng: number) =>
  ((lng - BOX.lngMin) / (BOX.lngMax - BOX.lngMin)) * VIEW_W;
const projectY = (lat: number) =>
  ((BOX.latMax - lat) / (BOX.latMax - BOX.latMin)) * VIEW_H;

// Simplified national outline (lng, lat), clockwise from the north-west.
const JORDAN_BORDER: Array<[number, number]> = [
  [35.55, 32.72],
  [36.02, 32.66],
  [36.41, 32.38],
  [37.13, 32.1],
  [38.79, 33.37],
  [39.3, 32.24],
  [38.2, 31.94],
  [37.0, 31.0],
  [37.0, 29.98],
  [36.75, 29.87],
  [34.97, 29.35],
  [35.1, 30.06],
  [35.44, 31.28],
  [35.57, 31.76],
  [35.57, 32.22],
];

const borderPoints = JORDAN_BORDER.map(
  ([lng, lat]) => `${projectX(lng).toFixed(1)},${projectY(lat).toFixed(1)}`,
).join(' ');

export function MapPage() {
  const result = useAsyncData(async () => {
    const [sale, rent] = await Promise.all([
      getProperties({marketType: 'sale', limit: 50}),
      getProperties({marketType: 'rent', limit: 50}),
    ]);
    return [...sale.items, ...rent.items].filter(
      item => typeof item.latitude === 'number' && typeof item.longitude === 'number',
    );
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  const pins = useMemo(
    () =>
      (result.data ?? []).map(property => ({
        property,
        x: projectX(property.longitude as number),
        y: projectY(property.latitude as number),
      })),
    [result.data],
  );

  const active = pins.find(pin => pin.property.id === activeId)?.property ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Location explorer"
        title="Property map"
        description="Verified records plotted by their registered coordinates across Jordan."
      />
      {result.loading ? <LoadingState label="Loading map records…" /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
      {result.data ? (
        <div className="map-layout">
          <div className="geo-map">
            <svg
              viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
              role="img"
              aria-label={`Map of Jordan with ${pins.length} property locations`}>
              <defs>
                <pattern id="grid" width="46" height="42" patternUnits="userSpaceOnUse">
                  <path d="M46 0H0V42" fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width={VIEW_W} height={VIEW_H} fill="url(#grid)" />
              <polygon
                points={borderPoints}
                fill="rgba(26,26,26,0.06)"
                stroke="rgba(26,26,26,0.35)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <text x="12" y={VIEW_H - 14} fontSize="13" fill="rgba(0,0,0,0.35)" letterSpacing="3">
                JORDAN
              </text>
              {pins.map(({property, x, y}) => {
                const isActive = property.id === activeId;
                const rent = property.marketType === 'rent';
                return (
                  <g
                    key={property.id}
                    className="geo-pin"
                    transform={`translate(${x} ${y})`}
                    onClick={() => setActiveId(isActive ? null : property.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={property.title}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setActiveId(isActive ? null : property.id);
                      }
                    }}>
                    <circle r={isActive ? 9 : 6} fill={rent ? '#4a7a9b' : '#1a1a1a'} stroke="#fff" strokeWidth="2" />
                    {isActive ? (
                      <text x="12" y="4" fontSize="12" fontWeight="700" fill="#1a1a1a">
                        {property.title}
                      </text>
                    ) : null}
                  </g>
                );
              })}
            </svg>
            <div className="geo-map__legend">
              <span><i style={{background: '#1a1a1a'}} /> For sale</span>
              <span><i style={{background: '#4a7a9b'}} /> For rent</span>
              <strong>{pins.length} records</strong>
            </div>
          </div>

          {active ? (
            <Link className="geo-map__active" to={`/app/property/${active.id}`}>
              <div>
                <StatusBadge status={active.verificationStatus} />
                <h3>{active.title}</h3>
                <p>⌖ {active.location}</p>
              </div>
              <strong>{formatJod(active.price)}{active.marketType === 'rent' ? <small>/mo</small> : null}</strong>
            </Link>
          ) : null}

          <div className="map-list">
            {result.data.map((property: PropertyListItem) => (
              <button
                className={property.id === activeId ? 'map-result is-active' : 'map-result'}
                key={property.id}
                onClick={() => setActiveId(property.id)}
                type="button">
                <div>
                  <StatusBadge status={property.marketType} />
                  <h3>{property.title}</h3>
                  <p>{property.location}</p>
                </div>
                <strong>{formatJod(property.price)}</strong>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
