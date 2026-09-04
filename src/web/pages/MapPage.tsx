import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import {getProperties, type PropertyListItem} from '../../api/properties';
import {ErrorState, PropertyCover, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

type Sort = 'newest' | 'price_asc' | 'price_desc';
const SORT_LABEL: Record<Sort, string> = {
  newest: 'Newest',
  price_asc: 'Price ↑',
  price_desc: 'Price ↓',
};

const JORDAN_CENTER: [number, number] = [31.75, 36.0];
const OPEN_VIEW: {center: [number, number]; zoom: number} = {center: [31.95, 35.94], zoom: 10};
const PEEK_H = 168;
const snapMax = () => Math.max(300, Math.round((window.innerHeight - 110) * 0.78));
const snapHalf = () => Math.round((window.innerHeight - 110) * 0.44);

const shortPrice = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
};

const pinIcon = (property: PropertyListItem, active: boolean): L.DivIcon => {
  const rent = property.marketType === 'rent';
  const cls = `mpin${rent ? ' mpin--rent' : ''}${active ? ' is-active' : ''}`;
  const label = `JOD ${shortPrice(property.price)}`;
  const w = Math.max(48, 22 + label.length * 7.5);
  return L.divIcon({
    className: '',
    html: `<span class="${cls}">${label}</span><i class="mpin__tail"></i>`,
    iconSize: [w, 38],
    iconAnchor: [w / 2, 38],
  });
};

const clusterIcon = (cluster: L.MarkerCluster): L.DivIcon =>
  L.divIcon({
    className: '',
    html: `<span class="mcluster">${cluster.getChildCount()}</span>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });

export function MapPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'sale' | 'rent'>('sale');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [sheetH, setSheetH] = useState(PEEK_H);

  const result = useAsyncData(async () => {
    const [sale, rent] = await Promise.all([
      getProperties({marketType: 'sale', limit: 60}),
      getProperties({marketType: 'rent', limit: 60}),
    ]);
    return {sale: sale.items, rent: rent.items};
  });

  const items = useMemo<PropertyListItem[]>(() => {
    const base = (mode === 'sale' ? result.data?.sale : result.data?.rent) ?? [];
    const q = query.trim().toLowerCase();
    let list = base.filter(
      p => typeof p.latitude === 'number' && typeof p.longitude === 'number',
    );
    if (q) {
      list = list.filter(p =>
        `${p.title} ${p.location} ${p.city ?? ''} ${p.propertyType ?? ''}`
          .toLowerCase()
          .includes(q),
      );
    }
    return [...list].sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      return (b.verificationTimestamp || '').localeCompare(a.verificationTimestamp || '');
    });
  }, [mode, query, sort, result.data]);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const streetRef = useRef<L.LayerGroup | null>(null);
  const satRef = useRef<L.LayerGroup | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const listRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{startY: number; startH: number; moved: boolean} | null>(null);
  const fittedRef = useRef(false);

  // Init the map once.
  useEffect(() => {
    if (!mapEl.current || mapRef.current) return;
    const map = L.map(mapEl.current, {
      center: JORDAN_CENTER,
      zoom: 8,
      zoomControl: false,
      attributionControl: true,
    });
    const esri = (service: string) =>
      L.tileLayer(
        `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/{z}/{y}/{x}`,
        {maxZoom: 19, attribution: '© Esri · OpenStreetMap contributors'},
      );
    streetRef.current = L.layerGroup([
      esri('Canvas/World_Light_Gray_Base'),
      esri('Canvas/World_Light_Gray_Reference'),
    ]).addTo(map);
    satRef.current = L.layerGroup([
      esri('World_Imagery'),
      esri('Reference/World_Boundaries_and_Places'),
    ]);
    clusterRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 46,
      iconCreateFunction: clusterIcon,
    }).addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 60);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Street / satellite.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !streetRef.current || !satRef.current) return;
    (satellite ? streetRef.current : satRef.current).removeFrom(map);
    (satellite ? satRef.current : streetRef.current).addTo(map);
  }, [satellite]);

  // Rebuild markers when the visible set changes.
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;
    cluster.clearLayers();
    markersRef.current.clear();
    if (!items.length) return;

    items.forEach(property => {
      const latlng: L.LatLngTuple = [property.latitude!, property.longitude!];
      const marker = L.marker(latlng, {icon: pinIcon(property, false)}).on('click', () =>
        selectFromMap(property.id),
      );
      cluster.addLayer(marker);
      markersRef.current.set(property.id, marker);
    });
    if (!fittedRef.current) {
      // Open over Amman (the densest area) rather than the whole country.
      map.setView(OPEN_VIEW.center, OPEN_VIEW.zoom, {animate: false});
      fittedRef.current = true;
    }
  }, [items]);

  // Reflect selection.
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const property = items.find(item => item.id === id);
      if (property) marker.setIcon(pinIcon(property, id === activeId));
      marker.setZIndexOffset(id === activeId ? 1000 : 0);
    });
    if (activeId) {
      listRef.current
        ?.querySelector(`[data-id="${activeId}"]`)
        ?.scrollIntoView({behavior: 'smooth', block: 'nearest'});
    }
  }, [activeId, items]);

  // Keep Leaflet sized as the sheet moves / window resizes.
  useEffect(() => {
    const id = setTimeout(() => mapRef.current?.invalidateSize(), 160);
    return () => clearTimeout(id);
  }, [sheetH]);
  useEffect(() => {
    const onResize = () => {
      setSheetH(h => Math.min(h, snapMax()));
      mapRef.current?.invalidateSize();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const focusMarker = useCallback((property: PropertyListItem) => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    const marker = markersRef.current.get(property.id);
    if (!map || !cluster || !marker) return;
    setSheetH(h => Math.min(h, PEEK_H + 24));
    cluster.zoomToShowLayer(marker, () => {
      map.panTo([property.latitude!, property.longitude!], {animate: true, duration: 0.4});
    });
  }, []);

  function selectFromMap(id: string) {
    setActiveId(id);
    const property = items.find(item => item.id === id);
    if (property) focusMarker(property);
  }
  function selectFromList(property: PropertyListItem) {
    setActiveId(property.id);
    focusMarker(property);
  }

  // Sheet drag with snap points.
  const onGripDown = (event: ReactPointerEvent) => {
    drag.current = {startY: event.clientY, startH: sheetH, moved: false};
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  };
  const onGripMove = (event: ReactPointerEvent) => {
    if (!drag.current) return;
    const delta = drag.current.startY - event.clientY;
    if (Math.abs(delta) > 3) drag.current.moved = true;
    setSheetH(Math.max(PEEK_H, Math.min(snapMax(), drag.current.startH + delta)));
  };
  const onGripUp = (event: ReactPointerEvent) => {
    const state = drag.current;
    drag.current = null;
    (event.target as HTMLElement).releasePointerCapture(event.pointerId);
    if (!state) return;
    if (!state.moved) {
      setSheetH(h => (h > PEEK_H + 20 ? PEEK_H : snapHalf()));
      return;
    }
    const points = [PEEK_H, snapHalf(), snapMax()];
    setSheetH(current =>
      points.reduce((best, p) => (Math.abs(p - current) < Math.abs(best - current) ? p : best)),
    );
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
    setActiveId(null);
    map.fitBounds(
      L.latLngBounds(items.map(p => [p.latitude!, p.longitude!] as L.LatLngTuple)).pad(0.18),
      {maxZoom: 12},
    );
  };

  const active = items.find(item => item.id === activeId) ?? null;

  return (
    <div className="mapx">
      <div className="mapx__map" ref={mapEl} />

      {/* floating top: search + market toggle */}
      <div className="mapx__top">
        <div className="mapx-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="Search the map"
            onChange={event => setQuery(event.target.value)}
            placeholder="Search area or property"
            value={query}
          />
          {query ? (
            <button aria-label="Clear" onClick={() => setQuery('')} type="button">×</button>
          ) : null}
        </div>
        <div className="segmented-control mapx-modes" aria-label="Market type">
          {(['sale', 'rent'] as const).map(value => (
            <button
              className={mode === value ? 'active' : ''}
              key={value}
              onClick={() => {
                setMode(value);
                setActiveId(null);
                fittedRef.current = false;
              }}
              type="button">
              {value === 'sale' ? 'Buy' : 'Rent'}
            </button>
          ))}
        </div>
      </div>

      {/* right-edge controls */}
      <div className="mapx__controls">
        <button aria-label="Fit all" onClick={recenter} type="button">⊙</button>
        <button
          aria-label={satellite ? 'Map view' : 'Satellite view'}
          className={satellite ? 'is-active' : ''}
          onClick={() => setSatellite(v => !v)}
          type="button">
          {satellite ? '▦' : '◎'}
        </button>
      </div>

      {/* selected preview card — hidden once the list is pulled up */}
      {active && sheetH < snapHalf() + 30 ? (
        <Link className="mapx-preview" style={{bottom: sheetH + 54}} to={`/app/property/${active.id}`}>
          <div className="mapx-preview__thumb">
            <PropertyCover property={active} />
          </div>
          <div className="mapx-preview__body">
            <strong>
              {formatJod(active.price)}
              {active.marketType === 'rent' ? <span>/mo</span> : null}
            </strong>
            <h3>{active.title}</h3>
            <p>⌖ {active.location}</p>
          </div>
          <button
            aria-label="Close"
            className="mapx-preview__x"
            onClick={event => {
              event.preventDefault();
              setActiveId(null);
            }}
            type="button">
            ×
          </button>
        </Link>
      ) : null}

      <div className="mapx__sheet" style={{height: sheetH}}>
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
          <strong>
            {result.loading ? '—' : items.length} {mode === 'sale' ? 'for sale' : 'to rent'}
          </strong>
          <div className="mapx-sort">
            <button onClick={() => setSortOpen(o => !o)} type="button">
              ↕ {SORT_LABEL[sort]}
            </button>
            {sortOpen ? (
              <>
                <button className="mapx-sort__scrim" aria-hidden="true" onClick={() => setSortOpen(false)} type="button" />
                <div className="mapx-sort__menu">
                  {(['newest', 'price_asc', 'price_desc'] as Sort[]).map(option => (
                    <button
                      className={sort === option ? 'is-active' : ''}
                      key={option}
                      onClick={() => {
                        setSort(option);
                        setSortOpen(false);
                      }}
                      type="button">
                      {option === 'newest' ? 'Newest first' : option === 'price_asc' ? 'Price · low to high' : 'Price · high to low'}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
        {!result.loading && !result.error && !items.length ? (
          <p className="mapx__empty">
            {query ? 'Nothing here matches your search.' : 'No mapped listings in this market.'}
          </p>
        ) : null}

        <div className="mapx__list" ref={listRef}>
          {(result.loading ? [] : items).map(property => {
            const rent = property.marketType === 'rent';
            const isSaved = saved.has(property.id);
            return (
              <div
                className={property.id === activeId ? 'mrow is-active' : 'mrow'}
                data-id={property.id}
                key={property.id}>
                <button
                  className="mrow__main"
                  onClick={() => navigate(`/app/property/${property.id}`)}
                  type="button">
                  <div className="mrow__thumb">
                    <PropertyCover property={property} />
                  </div>
                  <div className="mrow__info">
                    <strong>
                      {formatJod(property.price)}
                      {rent ? <span>/mo</span> : null}
                    </strong>
                    <h3>{property.title}</h3>
                    <p>⌖ {property.location}</p>
                    <div className="mrow__specs">
                      {property.propertyType ? <span>{property.propertyType}</span> : null}
                      {property.bedrooms ? <span>{property.bedrooms} bd</span> : null}
                      {property.areaSqm ? <span>{property.areaSqm} m²</span> : null}
                    </div>
                  </div>
                </button>
                <div className="mrow__actions">
                  <button
                    aria-label={isSaved ? 'Saved' : 'Save'}
                    aria-pressed={isSaved}
                    className={isSaved ? 'mrow__save is-on' : 'mrow__save'}
                    onClick={() => toggleSave(property.id)}
                    type="button">
                    {isSaved ? '♥' : '♡'}
                  </button>
                  <button
                    aria-label="Show on map"
                    className="mrow__locate"
                    onClick={() => selectFromList(property)}
                    type="button">
                    ⌖
                  </button>
                </div>
              </div>
            );
          })}
          {result.loading
            ? [0, 1, 2].map(i => <div className="mrow-skel" key={i} />)
            : null}
        </div>
      </div>
    </div>
  );
}
