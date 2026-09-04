import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {Link} from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import {getProperties, type PropertyListItem} from '../../api/properties';
import {ErrorState, PropertyCover, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

type Mode = 'sale' | 'rent';
type Sort = 'newest' | 'price_asc' | 'price_desc';
type LocationState = 'idle' | 'locating' | 'found' | 'error';
type IconName =
  | 'chevron'
  | 'close'
  | 'expand'
  | 'filter'
  | 'heart'
  | 'layers'
  | 'locate'
  | 'pin'
  | 'search'
  | 'sort';

interface Filters {
  city: string | null;
  type: string | null;
  beds: number | null;
  maxPrice: number | null;
  verifiedOnly: boolean;
}

interface AreaBounds {
  south: number;
  west: number;
  north: number;
  east: number;
}

const SORT_LABEL: Record<Sort, string> = {
  newest: 'Newest',
  price_asc: 'Lowest price',
  price_desc: 'Highest price',
};
const SORTS: {label: string; value: Sort}[] = [
  {label: 'Newest first', value: 'newest'},
  {label: 'Price · low to high', value: 'price_asc'},
  {label: 'Price · high to low', value: 'price_desc'},
];
const CITIES = ['Amman', 'Aqaba', 'Irbid', 'Zarqa', 'Umrah'];
const PROPERTY_TYPES = ['Apartment', 'Villa', 'Land', 'Commercial'];
const PRICE_OPTIONS: Record<Mode, {label: string; value: number}[]> = {
  sale: [
    {label: '≤ 100K', value: 100_000},
    {label: '≤ 250K', value: 250_000},
    {label: '≤ 500K', value: 500_000},
    {label: '≤ 1M', value: 1_000_000},
  ],
  rent: [
    {label: '≤ 400/mo', value: 400},
    {label: '≤ 800/mo', value: 800},
    {label: '≤ 1,200/mo', value: 1_200},
    {label: '≤ 2,000/mo', value: 2_000},
  ],
};
const EMPTY_FILTERS: Filters = {
  city: null,
  type: null,
  beds: null,
  maxPrice: null,
  verifiedOnly: true,
};
const JORDAN_CENTER: [number, number] = [31.75, 36.0];
const OPEN_VIEW: {center: [number, number]; zoom: number} = {
  center: [31.95, 35.94],
  zoom: 10,
};
const PEEK_H = 176;
const snapMax = () => Math.max(330, Math.round(window.innerHeight * 0.76));
const snapHalf = () => Math.max(280, Math.round(window.innerHeight * 0.46));

function Icon({name}: {name: IconName}) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  };
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      {name === 'search' ? <><circle {...common} cx="11" cy="11" r="6.5" /><path {...common} d="m16 16 4 4" /></> : null}
      {name === 'filter' ? <><path {...common} d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle {...common} cx="16" cy="7" r="2" /><circle {...common} cx="8" cy="17" r="2" /></> : null}
      {name === 'locate' ? <><circle {...common} cx="12" cy="12" r="3.5" /><circle {...common} cx="12" cy="12" r="7.5" /><path {...common} d="M12 2v2M12 20v2M2 12h2M20 12h2" /></> : null}
      {name === 'layers' ? <><path {...common} d="m12 3 9 5-9 5-9-5 9-5Z" /><path {...common} d="m3 12 9 5 9-5M3 16l9 5 9-5" /></> : null}
      {name === 'expand' ? <path {...common} d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" /> : null}
      {name === 'chevron' ? <path {...common} d="m9 5 7 7-7 7" /> : null}
      {name === 'close' ? <path {...common} d="m6 6 12 12M18 6 6 18" /> : null}
      {name === 'sort' ? <path {...common} d="M8 4v16m0 0-3-3m3 3 3-3M16 20V4m0 0-3 3m3-3 3 3" /> : null}
      {name === 'pin' ? <><path {...common} d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle {...common} cx="12" cy="10" r="2.5" /></> : null}
      {name === 'heart' ? <path {...common} d="M20.8 5.8c-1.8-2-5-1.8-6.8.2L12 8.2 10 6C8.2 4 5 3.8 3.2 5.8c-1.7 1.9-1.5 4.8.3 6.6L12 21l8.5-8.6c1.8-1.8 2-4.7.3-6.6Z" /> : null}
    </svg>
  );
}

const shortPrice = (value: number): string => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return `${value}`;
};

const pinIcon = (property: PropertyListItem, active: boolean): L.DivIcon => {
  const rent = property.marketType === 'rent';
  const cls = `mpin${rent ? ' mpin--rent' : ''}${active ? ' is-active' : ''}`;
  const label = `JOD ${shortPrice(property.price)}`;
  const width = Math.max(58, 24 + label.length * 7.2);
  return L.divIcon({
    className: '',
    html: `<span class="${cls}"><i></i>${label}</span><span class="mpin__tail"></span>`,
    iconSize: [width, 40],
    iconAnchor: [width / 2, 40],
  });
};

const clusterIcon = (cluster: L.MarkerCluster): L.DivIcon =>
  L.divIcon({
    className: '',
    html: `<span class="mcluster">${cluster.getChildCount()}</span>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });

const toAreaBounds = (bounds: L.LatLngBounds): AreaBounds => ({
  south: bounds.getSouth(),
  west: bounds.getWest(),
  north: bounds.getNorth(),
  east: bounds.getEast(),
});

const insideBounds = (property: PropertyListItem, bounds: AreaBounds) =>
  property.latitude! >= bounds.south &&
  property.latitude! <= bounds.north &&
  property.longitude! >= bounds.west &&
  property.longitude! <= bounds.east;

function filterListings(items: PropertyListItem[], query: string, filters: Filters) {
  const normalized = query.trim().toLowerCase();
  return items.filter(property => {
    if (typeof property.latitude !== 'number' || typeof property.longitude !== 'number') return false;
    if (normalized && !`${property.title} ${property.location} ${property.city ?? ''} ${property.propertyType ?? ''}`.toLowerCase().includes(normalized)) return false;
    if (filters.city && property.city !== filters.city) return false;
    if (filters.type && property.propertyType !== filters.type) return false;
    if (filters.beds && (property.bedrooms ?? 0) < filters.beds) return false;
    if (filters.maxPrice && property.price > filters.maxPrice) return false;
    if (filters.verifiedOnly && property.verificationStatus !== 'verified') return false;
    return true;
  });
}

export function MapPage() {
  const [mode, setMode] = useState<Mode>('sale');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [satellite, setSatellite] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [sheetH, setSheetH] = useState(PEEK_H);
  const [locationState, setLocationState] = useState<LocationState>('idle');
  const [toast, setToast] = useState<string | null>(null);
  const [areaBounds, setAreaBounds] = useState<AreaBounds | null>(null);
  const [pendingBounds, setPendingBounds] = useState<AreaBounds | null>(null);
  const [showAreaSearch, setShowAreaSearch] = useState(false);

  const result = useAsyncData(async () => {
    const [sale, rent] = await Promise.all([
      getProperties({marketType: 'sale', limit: 60}),
      getProperties({marketType: 'rent', limit: 60}),
    ]);
    return {sale: sale.items, rent: rent.items};
  });

  const marketItems = useMemo(
    () => (mode === 'sale' ? result.data?.sale : result.data?.rent) ?? [],
    [mode, result.data],
  );
  const filteredItems = useMemo(() => {
    const list = filterListings(marketItems, query, filters);
    return [...list].sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      return (b.verificationTimestamp || '').localeCompare(a.verificationTimestamp || '');
    });
  }, [filters, marketItems, query, sort]);
  const items = useMemo(
    () => (areaBounds ? filteredItems.filter(property => insideBounds(property, areaBounds)) : filteredItems),
    [areaBounds, filteredItems],
  );
  const draftCount = useMemo(
    () => filterListings(marketItems, query, draftFilters).length,
    [draftFilters, marketItems, query],
  );
  const pendingCount = useMemo(
    () => pendingBounds ? filteredItems.filter(property => insideBounds(property, pendingBounds)).length : 0,
    [filteredItems, pendingBounds],
  );
  const activeFilterCount =
    (filters.city ? 1 : 0) +
    (filters.type ? 1 : 0) +
    (filters.beds ? 1 : 0) +
    (filters.maxPrice ? 1 : 0) +
    (filters.verifiedOnly ? 0 : 1);

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const streetRef = useRef<L.LayerGroup | null>(null);
  const satelliteRef = useRef<L.LayerGroup | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const locationLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const listRef = useRef<HTMLDivElement | null>(null);
  const drag = useRef<{startY: number; startH: number; moved: boolean} | null>(null);
  const fittedRef = useRef(false);
  const userInteractedRef = useRef(false);

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
    satelliteRef.current = L.layerGroup([
      esri('World_Imagery'),
      esri('Reference/World_Boundaries_and_Places'),
    ]);
    clusterRef.current = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 46,
      iconCreateFunction: clusterIcon,
    }).addTo(map);
    locationLayerRef.current = L.layerGroup().addTo(map);

    const markInteraction = () => {
      userInteractedRef.current = true;
    };
    const onMoveEnd = () => {
      if (!userInteractedRef.current) return;
      userInteractedRef.current = false;
      setPendingBounds(toAreaBounds(map.getBounds()));
      setShowAreaSearch(true);
    };
    const onLocationFound = (event: L.LocationEvent) => {
      locationLayerRef.current?.clearLayers();
      L.circle(event.latlng, {
        radius: Math.min(event.accuracy, 300),
        color: '#2f5a4e',
        weight: 1,
        fillColor: '#2f5a4e',
        fillOpacity: 0.08,
        interactive: false,
      }).addTo(locationLayerRef.current!);
      L.circleMarker(event.latlng, {
        radius: 7,
        color: '#fcfbf7',
        weight: 3,
        fillColor: '#2f5a4e',
        fillOpacity: 1,
      }).bindTooltip('Your location').addTo(locationLayerRef.current!);
      setLocationState('found');
      setToast('Your location is now visible');
    };
    const onLocationError = () => {
      setLocationState('error');
      setToast('Location is unavailable. Check your browser permission.');
    };

    map.getContainer().addEventListener('pointerdown', markInteraction);
    map.getContainer().addEventListener('wheel', markInteraction, {passive: true});
    map.on('moveend', onMoveEnd);
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    mapRef.current = map;
    window.setTimeout(() => map.invalidateSize(), 60);

    return () => {
      map.getContainer().removeEventListener('pointerdown', markInteraction);
      map.getContainer().removeEventListener('wheel', markInteraction);
      map.off('moveend', onMoveEnd);
      map.off('locationfound', onLocationFound);
      map.off('locationerror', onLocationError);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !streetRef.current || !satelliteRef.current) return;
    (satellite ? streetRef.current : satelliteRef.current).removeFrom(map);
    (satellite ? satelliteRef.current : streetRef.current).addTo(map);
  }, [satellite]);

  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    if (!map || !cluster) return;
    cluster.clearLayers();
    markersRef.current.clear();
    items.forEach(property => {
      const marker = L.marker([property.latitude!, property.longitude!], {
        alt: `${property.title}, ${formatJod(property.price)}`,
        icon: pinIcon(property, false),
        keyboard: true,
        riseOnHover: true,
        title: property.title,
      }).on('click', () => {
        setActiveId(property.id);
        setSheetH(PEEK_H);
      });
      cluster.addLayer(marker);
      markersRef.current.set(property.id, marker);
    });
    if (items.length && !fittedRef.current) {
      map.setView(OPEN_VIEW.center, OPEN_VIEW.zoom, {animate: false});
      fittedRef.current = true;
    }
  }, [items]);

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

  useEffect(() => {
    if (activeId && !items.some(item => item.id === activeId)) setActiveId(null);
  }, [activeId, items]);

  useEffect(() => {
    const timeout = window.setTimeout(() => mapRef.current?.invalidateSize(), 160);
    return () => window.clearTimeout(timeout);
  }, [sheetH]);

  useEffect(() => {
    const onResize = () => {
      setSheetH(height => Math.min(height, snapMax()));
      mapRef.current?.invalidateSize();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!filtersOpen && !sortOpen) return;
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setFiltersOpen(false);
      setSortOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filtersOpen, sortOpen]);

  const focusMarker = useCallback((property: PropertyListItem) => {
    const map = mapRef.current;
    const cluster = clusterRef.current;
    const marker = markersRef.current.get(property.id);
    if (!map || !cluster || !marker) return;
    setActiveId(property.id);
    setSheetH(PEEK_H);
    cluster.zoomToShowLayer(marker, () => {
      map.panTo([property.latitude!, property.longitude!], {animate: true, duration: 0.4});
    });
  }, []);

  const toggleSave = useCallback((id: string) => {
    setSaved(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const setNearestSnap = (direction: 'up' | 'down') => {
    const points = [PEEK_H, snapHalf(), snapMax()];
    if (direction === 'up') {
      setSheetH(current => points.find(point => point > current + 20) ?? snapMax());
    } else {
      setSheetH(current => [...points].reverse().find(point => point < current - 20) ?? PEEK_H);
    }
  };

  const onGripDown = (event: ReactPointerEvent) => {
    drag.current = {startY: event.clientY, startH: sheetH, moved: false};
    event.currentTarget.setPointerCapture(event.pointerId);
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
    event.currentTarget.releasePointerCapture(event.pointerId);
    if (!state) return;
    if (!state.moved) {
      setSheetH(height => height > PEEK_H + 20 ? PEEK_H : snapHalf());
      return;
    }
    const points = [PEEK_H, snapHalf(), snapMax()];
    setSheetH(current =>
      points.reduce((best, point) => Math.abs(point - current) < Math.abs(best - current) ? point : best),
    );
  };
  const onGripKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setNearestSnap('up');
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setNearestSnap('down');
    }
    if (event.key === 'Home') {
      event.preventDefault();
      setSheetH(PEEK_H);
    }
    if (event.key === 'End') {
      event.preventDefault();
      setSheetH(snapMax());
    }
  };

  const switchMode = (nextMode: Mode) => {
    setMode(nextMode);
    setFilters(current => ({...current, maxPrice: null}));
    setDraftFilters(current => ({...current, maxPrice: null}));
    setActiveId(null);
    setAreaBounds(null);
    setShowAreaSearch(false);
    fittedRef.current = false;
  };

  const recenter = () => {
    const map = mapRef.current;
    if (!map || !filteredItems.length) return;
    setActiveId(null);
    setAreaBounds(null);
    setShowAreaSearch(false);
    map.fitBounds(
      L.latLngBounds(filteredItems.map(property => [property.latitude!, property.longitude!] as L.LatLngTuple)).pad(0.16),
      {animate: true, maxZoom: 12, padding: [42, 42]},
    );
  };

  const locateUser = () => {
    const map = mapRef.current;
    if (!map) return;
    setLocationState('locating');
    setToast(null);
    map.locate({enableHighAccuracy: true, maxZoom: 15, setView: true, timeout: 9000});
  };

  const openFilters = () => {
    setDraftFilters({...filters});
    setFiltersOpen(true);
  };
  const resetFilters = () => setDraftFilters(EMPTY_FILTERS);
  const applyFilters = () => {
    setFilters(draftFilters);
    setActiveId(null);
    setFiltersOpen(false);
  };

  const active = items.find(item => item.id === activeId) ?? null;
  const placeLabel = filters.city ?? (areaBounds ? 'this map area' : 'Jordan');
  const resultNoun = mode === 'sale' ? (items.length === 1 ? 'home' : 'homes') : items.length === 1 ? 'rental' : 'rentals';

  return (
    <div className={satellite ? 'mapx is-satellite' : 'mapx'}>
      <div aria-label="Property map" className="mapx__map" ref={mapEl} role="application" />

      <div className="mapx__top">
        <Link aria-label="Aqarya home" className="mapx-brand" to="/app">A</Link>
        <form
          className="mapx-search"
          onSubmit={(event: FormEvent) => event.preventDefault()}
          role="search">
          <Icon name="search" />
          <input
            aria-label="Search the map"
            enterKeyHint="search"
            onChange={event => setQuery(event.target.value)}
            placeholder="Area, city, or property"
            value={query}
          />
          {query ? (
            <button aria-label="Clear search" onClick={() => setQuery('')} type="button">
              <Icon name="close" />
            </button>
          ) : null}
        </form>
        <button
          aria-label="Open map filters"
          className={activeFilterCount ? 'mapx-filter-button has-count' : 'mapx-filter-button'}
          onClick={openFilters}
          title="Filters"
          type="button">
          <Icon name="filter" />
          {activeFilterCount ? <b>{activeFilterCount}</b> : null}
        </button>
        <div aria-label="Market type" className="mapx-modes" role="group">
          {(['sale', 'rent'] as const).map(value => (
            <button
              aria-pressed={mode === value}
              className={mode === value ? 'active' : ''}
              key={value}
              onClick={() => switchMode(value)}
              type="button">
              {value === 'sale' ? 'Buy' : 'Rent'}
            </button>
          ))}
        </div>
      </div>

      {showAreaSearch && pendingBounds ? (
        <button
          className="mapx-area-search"
          onClick={() => {
            setAreaBounds(pendingBounds);
            setActiveId(null);
            setShowAreaSearch(false);
          }}
          type="button">
          <Icon name="search" />
          {pendingCount ? `Show ${pendingCount} in this area` : 'Search this area'}
        </button>
      ) : null}

      <div className="mapx__controls">
        <button
          aria-label="Find my location"
          aria-pressed={locationState === 'found'}
          className={locationState === 'found' ? 'is-active' : ''}
          disabled={locationState === 'locating'}
          onClick={locateUser}
          title="My location"
          type="button">
          {locationState === 'locating' ? <span className="mapx-spinner" /> : <Icon name="locate" />}
        </button>
        <button aria-label="Fit all results" onClick={recenter} title="Fit all results" type="button">
          <Icon name="expand" />
        </button>
        <button
          aria-label={satellite ? 'Use street map' : 'Use satellite map'}
          aria-pressed={satellite}
          className={satellite ? 'is-active' : ''}
          onClick={() => setSatellite(value => !value)}
          title={satellite ? 'Street map' : 'Satellite map'}
          type="button">
          <Icon name="layers" />
        </button>
      </div>

      {toast ? (
        <div aria-live="polite" className={locationState === 'error' ? 'mapx-toast is-error' : 'mapx-toast'} role="status">
          {toast}
        </div>
      ) : null}

      {active && sheetH < snapHalf() + 30 ? (
        <article className="mapx-preview" style={{bottom: sheetH + 14}}>
          <Link className="mapx-preview__link" to={`/app/property/${active.id}`}>
            <div className="mapx-preview__thumb"><PropertyCover property={active} /></div>
            <div className="mapx-preview__body">
              <div className="mapx-preview__meta">
                {active.verificationStatus === 'verified' ? <span><i />Verified</span> : null}
                <small>{active.propertyType}</small>
              </div>
              <strong>{formatJod(active.price)}{active.marketType === 'rent' ? <span>/mo</span> : null}</strong>
              <h3>{active.title}</h3>
              <p><Icon name="pin" />{active.location}</p>
            </div>
          </Link>
          <div className="mapx-preview__actions">
            <button
              aria-label={saved.has(active.id) ? 'Remove from saved' : 'Save property'}
              aria-pressed={saved.has(active.id)}
              className={saved.has(active.id) ? 'is-saved' : ''}
              onClick={() => toggleSave(active.id)}
              type="button">
              <Icon name="heart" />
            </button>
            <button aria-label="Close property preview" onClick={() => setActiveId(null)} type="button">
              <Icon name="close" />
            </button>
          </div>
        </article>
      ) : null}

      <section aria-label="Map results" className="mapx__sheet" style={{height: sheetH}}>
        <button
          aria-label={sheetH > PEEK_H + 20 ? 'Collapse results' : 'Expand results'}
          className="mapx__grip"
          onClick={() => setSheetH(height => height > PEEK_H + 20 ? PEEK_H : snapHalf())}
          onKeyDown={onGripKeyDown}
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          type="button">
          <span />
        </button>

        <div className="mapx__head">
          <div>
            <span className="mapx__eyebrow">Explore {placeLabel}</span>
            <strong aria-live="polite">{result.loading ? 'Finding homes…' : `${items.length} ${resultNoun}`}</strong>
          </div>
          <div className="mapx__head-actions">
            {areaBounds ? (
              <button className="mapx-area-clear" onClick={() => setAreaBounds(null)} type="button">All areas</button>
            ) : null}
            <div className="mapx-sort">
              <button
                aria-expanded={sortOpen}
                aria-haspopup="menu"
                aria-label={`Sort results: ${SORT_LABEL[sort]}`}
                onClick={() => setSortOpen(open => !open)}
                type="button">
                <Icon name="sort" /><span>{SORT_LABEL[sort]}</span>
              </button>
              {sortOpen ? (
                <>
                  <button aria-hidden="true" className="mapx-sort__scrim" onClick={() => setSortOpen(false)} tabIndex={-1} type="button" />
                  <div className="mapx-sort__menu" role="menu">
                    {SORTS.map(option => (
                      <button
                        aria-checked={sort === option.value}
                        className={sort === option.value ? 'is-active' : ''}
                        key={option.value}
                        onClick={() => {
                          setSort(option.value);
                          setSortOpen(false);
                        }}
                        role="menuitemradio"
                        type="button">
                        {option.label}<span aria-hidden="true">{sort === option.value ? '✓' : ''}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {result.error ? <ErrorState message={result.error} retry={result.refresh} /> : null}
        {!result.loading && !result.error && !items.length ? (
          <div className="mapx__empty">
            <span aria-hidden="true"><Icon name="pin" /></span>
            <strong>No homes found here</strong>
            <p>Try moving the map or widening your filters.</p>
            <button
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setAreaBounds(null);
                setQuery('');
              }}
              type="button">
              Clear search and filters
            </button>
          </div>
        ) : null}

        <div className="mapx__list" ref={listRef}>
          {(result.loading ? [] : items).map(property => {
            const rent = property.marketType === 'rent';
            const isSaved = saved.has(property.id);
            return (
              <article className={property.id === activeId ? 'mrow is-active' : 'mrow'} data-id={property.id} key={property.id}>
                <button className="mrow__main" onClick={() => focusMarker(property)} type="button">
                  <div className="mrow__thumb">
                    <PropertyCover property={property} />
                    {property.verificationStatus === 'verified' ? <span title="Verified property">✓</span> : null}
                  </div>
                  <div className="mrow__info">
                    <div className="mrow__price">
                      <strong>{formatJod(property.price)}{rent ? <span>/mo</span> : null}</strong>
                      <small>{property.propertyType}</small>
                    </div>
                    <h3>{property.title}</h3>
                    <p><Icon name="pin" />{property.location}</p>
                    <div className="mrow__specs">
                      {property.bedrooms ? <span>{property.bedrooms} bd</span> : null}
                      {property.bathrooms ? <span>{property.bathrooms} ba</span> : null}
                      {property.areaSqm ? <span>{property.areaSqm} m²</span> : null}
                    </div>
                  </div>
                </button>
                <div className="mrow__actions">
                  <button
                    aria-label={isSaved ? 'Remove from saved' : 'Save property'}
                    aria-pressed={isSaved}
                    className={isSaved ? 'mrow__save is-on' : 'mrow__save'}
                    onClick={() => toggleSave(property.id)}
                    type="button">
                    <Icon name="heart" />
                  </button>
                  <Link aria-label={`View ${property.title}`} className="mrow__view" to={`/app/property/${property.id}`}>
                    <Icon name="chevron" />
                  </Link>
                </div>
              </article>
            );
          })}
          {result.loading ? [0, 1, 2].map(index => <div className="mrow-skel" key={index} />) : null}
        </div>
      </section>

      <div className={filtersOpen ? 'map-filter is-open' : 'map-filter'}>
        <button aria-label="Close filters" className="map-filter__scrim" onClick={() => setFiltersOpen(false)} type="button" />
        <section aria-labelledby="map-filter-title" aria-modal="true" className="map-filter__panel" role="dialog">
          <div className="map-filter__grip" />
          <header className="map-filter__head">
            <div>
              <span>Refine the map</span>
              <h2 id="map-filter-title">Find your place</h2>
            </div>
            <button aria-label="Close filters" onClick={() => setFiltersOpen(false)} type="button"><Icon name="close" /></button>
          </header>
          <div className="map-filter__body">
            <div>
              <span className="map-filter__label">City</span>
              <div className="map-filter__chips">
                <button className={!draftFilters.city ? 'is-active' : ''} onClick={() => setDraftFilters(current => ({...current, city: null}))} type="button">Anywhere</button>
                {CITIES.map(city => <button className={draftFilters.city === city ? 'is-active' : ''} key={city} onClick={() => setDraftFilters(current => ({...current, city}))} type="button">{city}</button>)}
              </div>
            </div>
            <div>
              <span className="map-filter__label">Property type</span>
              <div className="map-filter__chips">
                <button className={!draftFilters.type ? 'is-active' : ''} onClick={() => setDraftFilters(current => ({...current, type: null}))} type="button">Any type</button>
                {PROPERTY_TYPES.map(type => <button className={draftFilters.type === type ? 'is-active' : ''} key={type} onClick={() => setDraftFilters(current => ({...current, type}))} type="button">{type}</button>)}
              </div>
            </div>
            <div>
              <span className="map-filter__label">Bedrooms</span>
              <div className="map-filter__chips map-filter__chips--even">
                {[null, 1, 2, 3].map(beds => <button className={draftFilters.beds === beds ? 'is-active' : ''} key={beds ?? 'any'} onClick={() => setDraftFilters(current => ({...current, beds}))} type="button">{beds ? `${beds}+` : 'Any'}</button>)}
              </div>
            </div>
            <div>
              <span className="map-filter__label">Maximum price</span>
              <div className="map-filter__chips map-filter__chips--even">
                <button className={!draftFilters.maxPrice ? 'is-active' : ''} onClick={() => setDraftFilters(current => ({...current, maxPrice: null}))} type="button">Any</button>
                {PRICE_OPTIONS[mode].map(option => <button className={draftFilters.maxPrice === option.value ? 'is-active' : ''} key={option.value} onClick={() => setDraftFilters(current => ({...current, maxPrice: option.value}))} type="button">{option.label}</button>)}
              </div>
            </div>
            <button
              aria-pressed={draftFilters.verifiedOnly}
              className="map-filter__verified"
              onClick={() => setDraftFilters(current => ({...current, verifiedOnly: !current.verifiedOnly}))}
              type="button">
              <span><i>✓</i><span><strong>Verified properties only</strong><small>Government records checked by Aqarya</small></span></span>
              <span aria-hidden="true" className={draftFilters.verifiedOnly ? 'switch active' : 'switch'}><i /></span>
            </button>
          </div>
          <footer className="map-filter__foot">
            <button className="map-filter__reset" onClick={resetFilters} type="button">Reset</button>
            <button className="map-filter__apply" onClick={applyFilters} type="button">Show {draftCount} {draftCount === 1 ? 'home' : 'homes'}</button>
          </footer>
        </section>
      </div>
    </div>
  );
}
