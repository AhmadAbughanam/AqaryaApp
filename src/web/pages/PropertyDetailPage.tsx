import {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {getPropertyDetails} from '../../api/properties';
import {reportListing} from '../../api/moderation';
import {TransactionIcon} from '../TransactionIcon';
import {ErrorState, LoadingState, formatDate, formatJod, propertyImage} from '../ui';
import {useAsyncData} from '../useAsyncData';

const auditLabel = (action: string) => {
  const labels: Record<string, string> = {
    listing_submitted: 'Listing submitted for review',
    listing_verified: 'Listing verified for publication',
    listing_changes_requested: 'Listing changes requested',
    listing_rejected: 'Listing review completed',
  };
  return labels[action] ?? action.replaceAll('_', ' ');
};

export function PropertyDetailPage() {
  const {id = ''} = useParams();
  const result = useAsyncData(() => getPropertyDetails(id), [id]);
  const [reportState, setReportState] = useState<'idle' | 'working' | 'sent' | 'error'>('idle');

  async function report() {
    setReportState('working');
    try {
      await reportListing(id, {reason: 'misleading_info'});
      setReportState('sent');
    } catch {
      setReportState('error');
    }
  }

  if (result.loading) return <LoadingState label="Loading property record…" />;
  if (result.error) return <ErrorState message={result.error} retry={result.refresh} />;
  const property = result.data;
  if (!property) return null;

  const isVerified = property.verificationStatus === 'verified';
  const isRental = property.marketType === 'rent';
  const proofSuffix = property.ownershipProofNumber.slice(-4);

  return (
    <div className="property-page">
      <header className="property-page__bar">
        <Link className="transaction-back" to="/app"><TransactionIcon name="back" />Back to properties</Link>
        <span className="transaction-secure"><TransactionIcon name="lock" />Source-authenticated record</span>
      </header>

      <section className="property-showcase">
        <img alt={property.title} src={propertyImage(property)} />
        <div className="property-showcase__shade" />
        <div className="property-showcase__badges">
          <span className={isVerified ? 'is-verified' : 'is-review'}>
            <TransactionIcon name={isVerified ? 'shield' : 'document'} />
            {isVerified ? 'Verified listing' : 'Verification in progress'}
          </span>
          <span>{isRental ? 'For rent' : 'For sale'}</span>
        </div>
        <div className="property-showcase__title">
          <p><TransactionIcon name="pin" />{property.location}</p>
          <h1>{property.title}</h1>
          <div>
            <span>{property.propertyType || 'Property'}</span>
            {property.areaSqm ? <span>{property.areaSqm.toLocaleString()} m²</span> : null}
            {property.bedrooms ? <span>{property.bedrooms} bedrooms</span> : null}
          </div>
        </div>
      </section>

      <div className="property-detail-grid">
        <main className="property-detail-main">
          <section className="property-trust-strip" aria-label="Property verification summary">
            <TrustItem label="Property source" status={property.propertyVerificationStatus} />
            <TrustItem label="Advertiser identity" status={property.identityVerificationStatus} />
            <TrustItem label="Digital record" status={property.recordStatus} />
          </section>

          <section className="property-sheet" id="overview">
            <div className="property-section-title"><span className="eyebrow">Overview</span><h2>Property details</h2></div>
            <p className="property-description">{property.description}</p>
            <dl className="property-facts">
              <Fact label="Property type" value={property.propertyType || 'Property'} />
              <Fact label="Area" value={property.areaSqm ? `${property.areaSqm.toLocaleString()} m²` : 'Not provided'} />
              <Fact label="Bedrooms" value={property.bedrooms?.toString() ?? 'Not applicable'} />
              <Fact label="Bathrooms" value={property.bathrooms?.toString() ?? 'Not applicable'} />
              <Fact label="Ownership" value={property.ownershipType} />
              <Fact label="Advertiser" value={property.ownerName} />
            </dl>
            {property.amenities?.length ? (
              <div className="property-amenities">
                <span>Included features</span>
                <div>{property.amenities.map(item => <span key={item}><TransactionIcon name="check" />{item}</span>)}</div>
              </div>
            ) : null}
          </section>

          <section className="property-sheet" id="record">
            <div className="property-record-head">
              <div><span className="eyebrow">Trust record</span><h2>What Aqarya verified</h2></div>
              <span className="property-record-seal">A</span>
            </div>
            <p className="property-record-intro">Aqarya displays a limited, traceable view of the source record. The competent government registry remains the legal source of ownership.</p>
            <div className="property-record-grid">
              <div><span>Record reference</span><strong className="mono">{property.verificationRecordId || 'Pending'}</strong></div>
              <div><span>Source fingerprint</span><strong className="mono">{property.recordHash}</strong></div>
              <div><span>Ownership proof</span><strong>{property.ownershipProofType.replaceAll('_', ' ')} ·••{proofSuffix}</strong></div>
              <div><span>Last verified</span><strong>{formatDate(property.verificationTimestamp)}</strong></div>
            </div>
            {property.auditTrail.length ? (
              <div className="property-audit">
                <h3>Recent record activity</h3>
                <ol>
                  {property.auditTrail.slice(0, 4).map(event => (
                    <li key={event.id}><i /><div><strong>{auditLabel(event.actionType)}</strong><span>{event.actorName} · {formatDate(event.timestamp)}</span></div></li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>

          <section className="property-report">
            <div><TransactionIcon name="report" /><span><strong>Something does not look right?</strong><small>Reports are logged and reviewed without alerting the advertiser.</small></span></div>
            {reportState === 'sent' ? <span className="property-report__sent"><TransactionIcon name="check" />Report sent</span> : (
              <button disabled={reportState === 'working'} onClick={() => void report()} type="button">
                {reportState === 'working' ? 'Sending…' : reportState === 'error' ? 'Try again' : 'Report listing'}
              </button>
            )}
          </section>
        </main>

        <aside className="property-action-card">
          <span>{isRental ? 'Monthly rent' : 'Asking price'}</span>
          <strong>{formatJod(property.price)}{isRental ? <small>/month</small> : null}</strong>
          <div className="property-action-card__seller"><span><TransactionIcon name="shield" /></span><div><strong>{property.ownerName}</strong><small>Identity linked to this listing</small></div></div>

          {property.viewerIsOwner ? (
            <Link className="transaction-primary" to="/app/my-properties">Manage in my portfolio<TransactionIcon name="arrow" /></Link>
          ) : isVerified ? (
            <Link className="transaction-primary" to={`/app/property/${property.id}/offer`}>
              {isRental ? 'Start rental request' : 'Prepare an offer'}<TransactionIcon name="arrow" />
            </Link>
          ) : (
            <button className="transaction-primary" disabled type="button">Available after verification</button>
          )}

          <Link className="transaction-secondary" to="/app/messages"><TransactionIcon name="message" />Ask a question</Link>
          <p className="property-action-card__note"><TransactionIcon name="shield" />No money is collected here. Payment and legal registration continue through licensed and competent authorities.</p>
          <div className="property-action-card__steps">
            <strong>How the journey works</strong>
            <span><i>1</i>Submit structured terms</span>
            <span><i>2</i>Owner reviews and responds</span>
            <span><i>3</i>Continue through official channels</span>
          </div>
        </aside>
      </div>
    </div>
  );
}

function TrustItem({label, status}: {label: string; status: string}) {
  const complete = status === 'verified' || status === 'sealed';
  return <div className={complete ? 'is-complete' : ''}><span><TransactionIcon name={complete ? 'check' : 'document'} /></span><div><strong>{label}</strong><small>{complete ? 'Verified' : 'Reviewing'}</small></div></div>;
}

function Fact({label, value}: {label: string; value: string}) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}
