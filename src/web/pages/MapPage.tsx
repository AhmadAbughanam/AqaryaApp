import {useEffect, useMemo, useRef, useState} from 'react';
import {Link} from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {getProperties, type PropertyListItem} from '../../api/properties';
import {ErrorState, LoadingState, PageHeader, StatusBadge, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

const JORDAN_CENTER: [number, number] = [31.7, 36.2];

const shortPrice = (value: number): string => {
  if (value >= 1_000_000) return `JOD ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `JOD ${Math.round(value / 1_000)}K`;
  return `JOD ${value}`;
};

const priceIcon = (property: PropertyListItem, active: boolean): L.DivIcon => {
  const rent = property.marketType === 'rent';
  const cls = `map-pin${rent ? ' map-pin--rent' : ''}${active ? ' is-active' : ''}`;
  const label = shortPrice(property.price);
  const width = Math.max(46, 22 + label.length * 8);
  return L.divIcon({
    className: '',
    html: `<span class="${cls}">${label}</span><i class="map-pin__tail"></i>`,
    iconSize: [width, 40],
    iconAnchor: [width / 2, 40],
  });
};

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

  const items = useMemo(() => result.data ?? [], [result.data]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [satellite, setSatellite] = useState(false);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const streetRef = useRef<L.LayerGroup | null>(null);
  const satRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Init the map once.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, {
      center: JORDAN_CENTER,
      zoom: 7,
      zoomControl: true,
      attributionControl: true,
    });
    // Esri "Light Gray Canvas" — keyless, clean neutral basemap (base + labels).
    const esri = (service: string) =>
      L.tileLayer(
        `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`,
        {maxZoom: 19, attribution: '© Esri, HERE, Garmin, © OpenStreetMap contributors'},
      );
    streetRef.current = L.layerGroup([
      esri('Canvas/World_Light_Gray_Base'),
      esri('Canvas/World_Light_Gray_Reference'),
    ]).addTo(map);
    satRef.current = L.layerGroup([
      esri('World_Imagery'),
      esri('Reference/World_Boundaries_and_Places'),
    ]);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Street / satellite toggle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !streetRef.current || !satRef.current) return;
    if (satellite) {
      map.removeLayer(streetRef.current);
      satRef.current.addTo(map);
    } else {
      map.removeLayer(satRef.current);
      streetRef.current.addTo(map);
    }
  }, [satellite]);

  // (Re)build markers when the data changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    if (!items.length) return;

    const bounds: L.LatLngExpression[] = [];
    items.forEach(property => {
      const latlng: [number, number] = [property.latitude!, property.longitude!];
      bounds.push(latlng);
      const marker = L.marker(latlng, {icon: priceIcon(property, false)})
        .addTo(map)
        .on('click', () => setActiveId(current => (current === property.id ? null : property.id)));
      markersRef.current.set(property.id, marker);
    });
    map.fitBounds(L.latLngBounds(bounds as L.LatLngTuple[]).pad(0.25), {maxZoom: 12});
  }, [items]);

  // Reflect the active selection on the markers + recentre.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker, id) => {
      const property = items.find(item => item.id === id);
      if (property) marker.setIcon(priceIcon(property, id === activeId));
      if (id === activeId) marker.setZIndexOffset(1000);
      else marker.setZIndexOffset(0);
    });
    if (activeId) {
      const property = items.find(item => item.id === activeId);
      if (property) map.panTo([property.latitude!, property.longitude!], {animate: true});
    }
  }, [activeId, items]);

  const active = items.find(item => item.id === activeId) ?? null;

  return (
    <>
      <PageHeader
        eyebrow="Location explorer"
        title="Property map"
        description="Verified records plotted by their registered coordinates across Jordan."
      />
      {result.loading ? <LoadingState label="Loading map records…" /> : null}
      {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}

      <div className="map-layout">
        <div className="leaflet-wrap">
          <div className="leaflet-map" ref={mapEl} />
          <button
            className="leaflet-wrap__toggle"
            onClick={() => setSatellite(value => !value)}
            type="button">
            {satellite ? 'Map' : 'Satellite'}
          </button>
        </div>

        {active ? (
          <Link className="geo-map__active" to={`/app/property/${active.id}`}>
            <div>
              <StatusBadge status={active.verificationStatus} />
              <h3>{active.title}</h3>
              <p>⌖ {active.location}</p>
            </div>
            <strong>
              {formatJod(active.price)}
              {active.marketType === 'rent' ? <small>/mo</small> : null}
            </strong>
          </Link>
        ) : null}

        <div className="map-list">
          {items.map(property => (
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
    </>
  );
}
