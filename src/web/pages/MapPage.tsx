import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {useNavigate} from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {getProperties, type PropertyListItem} from '../../api/properties';
import {ErrorState, LoadingState, formatJod, propertyImage} from '../ui';
import {useAsyncData} from '../useAsyncData';

const JORDAN_CENTER: [number, number] = [31.7, 36.1];
const PEEK_H = 208;

const sheetMax = () => Math.max(320, Math.round((window.innerHeight - 110) * 0.74));

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
  const navigate = useNavigate();
  const [mode, setMode] = useState<'sale' | 'rent'>('sale');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [sheetH, setSheetH] = useState(PEEK_H);

  const result = useAsyncData(async () => {
    const [sale, rent] = await Promise.all([
      getProperties({marketType: 'sale', limit: 50}),
      getProperties({marketType: 'rent', limit: 50}),
    ]);
    return {sale: sale.items, rent: rent.items};
  });

  const items = useMemo<PropertyListItem[]>(() => {
    const list = mode === 'sale' ? result.data?.sale : result.data?.rent;
    return (list ?? []).filter(
      p => typeof p.latitude === 'number' && typeof p.longitude === 'number',
    );
  }, [mode, result.data]);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const streetRef = useRef<L.LayerGroup | null>(null);
  const satRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const listRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{startY: number; startH: number} | null>(null);

  // Init the map once.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, {
      center: JORDAN_CENTER,
      zoom: 7,
      zoomControl: false,
      attributionControl: true,
    });
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
    setTimeout(() => map.invalidateSize(), 60);
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

  // Rebuild markers when the visible set changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current.clear();
    setActiveId(null);
    if (!items.length) return;

    const bounds: L.LatLngTuple[] = [];
    items.forEach(property => {
      const latlng: L.LatLngTuple = [property.latitude!, property.longitude!];
      bounds.push(latlng);
      const marker = L.marker(latlng, {icon: priceIcon(property, false)})
        .addTo(map)
        .on('click', () => setActiveId(property.id));
      markersRef.current.set(property.id, marker);
    });
    if (bounds.length === 1) map.setView(bounds[0], 13);
    else map.fitBounds(L.latLngBounds(bounds).pad(0.2), {maxZoom: 12});
  }, [items]);

  // Reflect the active selection on markers + list.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach((marker, id) => {
      const property = items.find(item => item.id === id);
      if (property) marker.setIcon(priceIcon(property, id === activeId));
      marker.setZIndexOffset(id === activeId ? 1000 : 0);
    });
    if (activeId) {
      const property = items.find(item => item.id === activeId);
      if (property) map.panTo([property.latitude!, property.longitude!], {animate: true});
      listRef.current
        ?.querySelector(`[data-id="${activeId}"]`)
        ?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }
  }, [activeId, items]);

  // Keep Leaflet sized to the container as the sheet moves / window resizes.
  useEffect(() => {
    const id = setTimeout(() => mapRef.current?.invalidateSize(), 180);
    return () => clearTimeout(id);
  }, [sheetH]);
  useEffect(() => {
    const onResize = () => {
      setSheetH(h => Math.min(h, sheetMax()));
      mapRef.current?.invalidateSize();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onGripDown = (event: ReactPointerEvent) => {
    drag.current = {startY: event.clientY, startH: sheetH};
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onGripMove = (event: ReactPointerEvent) => {
    if (!drag.current) return;
    const next = drag.current.startH + (drag.current.startY - event.clientY);
    setSheetH(Math.max(PEEK_H, Math.min(sheetMax(), next)));
  };
  const onGripUp = (event: ReactPointerEvent) => {
    if (!drag.current) return;
    const mid = (PEEK_H + sheetMax()) / 2;
    setSheetH(sheetH > mid ? sheetMax() : PEEK_H);
    drag.current = null;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
  };

  const toggleSave = useCallback((id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const recenter = () => {
    const map = mapRef.current;
    if (!map || !items.length) return;
    const bounds = items.map(p => [p.latitude!, p.longitude!] as L.LatLngTuple);
    if (bounds.length === 1) map.setView(bounds[0], 13);
    else map.fitBounds(L.latLngBounds(bounds).pad(0.2), {maxZoom: 12});
  };

  return (
    <div className="mapx">
      <div className="mapx__map" ref={mapEl} />

      <div className="mapx__count">
        {result.loading ? '…' : `${items.length} on map`}
      </div>

      <div className="mapx__modes segmented-control" aria-label="Market type">
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

      <div className="mapx__sheet" style={{height: sheetH}}>
        <div className="mapx__controls">
          <button aria-label="Recentre" onClick={recenter} type="button">⊕</button>
          <button
            aria-label={satellite ? 'Street map' : 'Satellite'}
            className={satellite ? 'is-active' : ''}
            onClick={() => setSatellite(v => !v)}
            type="button">
            {satellite ? '▦' : '◎'}
          </button>
        </div>

        <div
          className="mapx__grip"
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          role="separator"
          aria-label="Resize list">
          <span />
        </div>

        <div className="mapx__head">
          <strong>{mode === 'sale' ? 'For sale' : 'For rent'}</strong>
          {items.length ? <span>{items.length} listings</span> : null}
        </div>

        {result.loading ? <LoadingState label="Loading map records…" /> : null}
        {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
        {!result.loading && !result.error && !items.length ? (
          <p className="mapx__empty">No {mode === 'sale' ? 'listings for sale' : 'rentals'} with map coordinates.</p>
        ) : null}

        <div className="mapx__list" ref={listRef}>
          {items.map(property => {
            const rent = property.marketType === 'rent';
            return (
              <button
                className={property.id === activeId ? 'mcard is-active' : 'mcard'}
                data-id={property.id}
                key={property.id}
                onClick={() => navigate(`/app/property/${property.id}`)}
                type="button">
                <div className="mcard__row">
                  <div className="mcard__thumb">
                    <img src={propertyImage(property)} alt="" loading="lazy" />
                    <span className="mcard__badge">{rent ? 'Rent' : 'Sale'}</span>
                  </div>
                  <div className="mcard__info">
                    <div className="mcard__titlerow">
                      <h3>{property.title}</h3>
                      <span
                        aria-label={saved.has(property.id) ? 'Saved' : 'Save'}
                        className={saved.has(property.id) ? 'mcard__heart is-on' : 'mcard__heart'}
                        onClick={event => {
                          event.stopPropagation();
                          toggleSave(property.id);
                        }}
                        role="button">
                        {saved.has(property.id) ? '♥' : '♡'}
                      </span>
                    </div>
                    {property.verificationStatus === 'verified' ? (
                      <span className="mcard__verified"><i />Verified</span>
                    ) : null}
                    <p className="mcard__loc">⌖ {property.location}</p>
                  </div>
                </div>
                <div className="mcard__divider" />
                <div className="mcard__pricerow">
                  <strong>
                    {formatJod(property.price)}
                    {rent ? <small>/mo</small> : null}
                  </strong>
                  <div className="mcard__specs">
                    {property.areaSqm ? <span>{property.areaSqm} m²</span> : null}
                    {property.bedrooms ? <span>{property.bedrooms} bd</span> : null}
                    {property.bathrooms ? <span>{property.bathrooms} ba</span> : null}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
