import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
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
  property.imageUrls?.[0] || AppImages.property[property.marketType].fullWidth;

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
  const tone = /verified|approved|published|completed|resolved|active|anchored/.test(
    normalized,
  )
    ? 'success'
    : /rejected|failed|frozen|dismissed|suspended/.test(normalized)
      ? 'danger'
      : /pending|review|submitted|open/.test(normalized)
        ? 'warning'
        : 'neutral';
  return <span className={`status status--${tone}`}>{normalized}</span>;
}

export function LoadingState({label = 'Loading…'}: {label?: string}) {
  return (
    <div className="state state--loading" role="status">
      <span className="spinner" />
      <p>{label}</p>
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

export function PropertyCard({property}: {property: PropertyListItem}) {
  return (
    <article className="property-card">
      <Link className="property-card__image" to={`/app/property/${property.id}`}>
        <img src={propertyImage(property)} alt="" loading="lazy" />
        <StatusBadge status={property.verificationStatus} />
      </Link>
      <div className="property-card__content">
        <div className="property-card__meta">
          <span>{property.propertyType || property.marketType}</span>
          {property.areaSqm ? <span>{property.areaSqm} m²</span> : null}
        </div>
        <Link to={`/app/property/${property.id}`}>
          <h3>{property.title}</h3>
        </Link>
        <p>⌖ {property.location}</p>
        <div className="property-card__footer">
          <strong>
            {formatJod(property.price)}
            {property.marketType === 'rent' ? <small>/month</small> : null}
          </strong>
          <span>{property.bedrooms ? `${property.bedrooms} beds` : 'Verified record'}</span>
        </div>
      </div>
    </article>
  );
}

export function ProgressBar({value}: {value: number}) {
  const width = Math.max(0, Math.min(100, value));
  return (
    <div className="progress" aria-label={`${Math.round(width)}% funded`}>
      <span style={{width: `${width}%`}} />
    </div>
  );
}
