import type {ReactNode} from 'react';
import type {PropertyListItem} from '../api/properties';
import {AppImages} from '../assets/images';

export const formatJod = (value: number): string =>
  new Intl.NumberFormat('en-JO', {
    style: 'currency',
    currency: 'JOD',
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-JO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const propertyImage = (property: Pick<PropertyListItem, 'marketType' | 'imageUrls'>) =>
  property.imageUrls?.[0] ||
  (property.marketType === 'rent'
    ? AppImages.property.rent.fullWidth
    : AppImages.property.sale.fullWidth);

// Simple centred line glyphs on a 56×42 field, ground line at y≈34.
const COVER_GLYPHS: Record<'house' | 'apartment' | 'commercial' | 'land', string> = {
  house: 'M10 34h36M15 34V19l13-10 13 10v15M24 34v-9h8v9',
  apartment: 'M9 35h38M15 35V10h12v25M27 35V17h14v18M19 15h4M19 21h4M19 27h4M32 22h4M32 28h4',
  commercial: 'M9 35h38M13 35V13h30v22M20 13V8h16v5M20 20h6M30 20h6M20 27h6M30 27h6',
  land: 'M6 34h44M9 29c6-7 12-10 19-10s13 3 19 10M16 23c3-4 8-6 12-6s9 2 12 6M23 17c2-2 4-3 5-3s3 1 5 3',
};

const glyphFor = (type: string): string => {
  const t = type.toLowerCase();
  if (t.includes('villa') || t.includes('house')) return COVER_GLYPHS.house;
  if (t.includes('land') || t.includes('plot')) return COVER_GLYPHS.land;
  if (t.includes('commerc') || t.includes('office') || t.includes('retail')) return COVER_GLYPHS.commercial;
  return COVER_GLYPHS.apartment;
};

/** Deterministic, on-brand cover for a listing that has no photo. */
export function PropertyCover({
  property,
}: {
  property: Pick<PropertyListItem, 'id' | 'marketType' | 'propertyType' | 'imageUrls'>;
}) {
  const src = property.imageUrls?.[0];
  if (src) return <img alt="" className="prop-cover" loading="lazy" src={src} />;

  let hash = 0;
  for (let i = 0; i < property.id.length; i += 1) {
    hash = (hash * 31 + property.id.charCodeAt(i)) >>> 0;
  }
  const hue = 24 + (hash % 40);

  return (
    <div
      className="prop-cover prop-cover--gen"
      style={{
        background: `linear-gradient(150deg, hsl(${hue} 24% 83%), hsl(${hue + 22} 22% 71%))`,
      }}>
      <svg viewBox="0 0 56 42" aria-hidden="true">
        <path
          d={glyphFor(property.propertyType || 'apartment')}
          fill="none"
          stroke={`hsl(${hue + 8} 32% 36%)`}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.1"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-header__action">{action}</div> : null}
    </header>
  );
}

export function StatusBadge({status}: {status: string | null | undefined}) {
  const normalized = status?.replaceAll('_', ' ') || 'unknown';
  const tone = /verified|approved|published|completed|resolved|active|anchored|sealed/.test(
    normalized,
  )
    ? 'success'
    : /rejected|failed|frozen|dismissed|suspended/.test(normalized)
      ? 'danger'
      : /pending|review|submitted|open|draft|needs/.test(normalized)
        ? 'warning'
        : 'neutral';
  return <span className={`status status--${tone}`}>{normalized}</span>;
}

export function LoadingState({label = 'Loading…'}: {label?: string}) {
  return (
    <div className="state state--loading" role="status" aria-label={label}>
      <div className="skeleton-stack">
        <div className="skeleton skeleton--tall" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
    </div>
  );
}

export function ErrorState({message, retry}: {message: string; retry?: () => void}) {
  return (
    <div className="state state--error" role="alert">
      <strong>Something went wrong</strong>
      <p>{message}</p>
      {retry ? (
        <button className="button button--secondary" onClick={retry} type="button">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({title, description}: {title: string; description: string}) {
  return (
    <div className="state">
      <span className="state__icon">⌂</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function StatCard({label, value, hint}: {label: string; value: ReactNode; hint?: string}) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <small>{hint}</small> : null}
    </article>
  );
}

