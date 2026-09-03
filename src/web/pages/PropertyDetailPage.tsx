import {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {getPropertyDetails, submitStructuredOffer} from '../../api/properties';
import {reportListing} from '../../api/moderation';
import {
  ErrorState,
  LoadingState,
  PageHeader,
  StatusBadge,
  formatDate,
  formatJod,
  propertyImage,
} from '../ui';
import {useAsyncData} from '../useAsyncData';

export function PropertyDetailPage() {
  const {id = ''} = useParams();
  const result = useAsyncData(() => getPropertyDetails(id), [id]);
  const [notice, setNotice] = useState('');
  const [working, setWorking] = useState(false);

  async function makeOffer() {
    setWorking(true);
    setNotice('');
    try {
      const response = await submitStructuredOffer(id);
      setNotice(response.message);
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : 'Could not submit the offer.');
    } finally {
      setWorking(false);
    }
  }

  async function report() {
    setWorking(true);
    try {
      await reportListing(id, {reason: 'misleading_info'});
      setNotice('Thank you. The listing has been sent to the moderation team.');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not submit report.');
    } finally {
      setWorking(false);
    }
  }

  if (result.loading) return <LoadingState label="Loading property record…" />;
  if (result.error) return <ErrorState message={result.error} retry={result.refresh} />;
  const property = result.data;
  if (!property) return null;

  const isVerified = property.verificationStatus === 'verified';

  return (
    <>
      <PageHeader
        eyebrow={property.marketType === 'rent' ? 'For rent' : 'For sale'}
        title={property.title}
        description={property.location}
        action={<Link className="button button--secondary" to="/app">Back to listings</Link>}
      />
      <div className="detail-layout">
        <section>
          <div className="detail-hero">
            <img src={propertyImage(property)} alt={property.title} />
            <StatusBadge status={property.verificationStatus} />
          </div>
          <article className="panel prose-panel">
            <span className="eyebrow">Property overview</span>
            <h2>About this property</h2>
            <p>{property.description}</p>
            <div className="feature-grid">
              <div><span>Type</span><strong>{property.propertyType || 'Property'}</strong></div>
              <div><span>Area</span><strong>{property.areaSqm ? `${property.areaSqm} m²` : '—'}</strong></div>
              <div><span>Bedrooms</span><strong>{property.bedrooms ?? '—'}</strong></div>
              <div><span>Bathrooms</span><strong>{property.bathrooms ?? '—'}</strong></div>
              <div><span>Ownership</span><strong>{property.ownershipType}</strong></div>
              <div><span>Owner</span><strong>{property.ownerName}</strong></div>
            </div>
            {property.amenities?.length ? (
              <div className="chip-list">{property.amenities.map(item => <span key={item}>{item}</span>)}</div>
            ) : null}
          </article>
          <article className="panel verification-panel">
            <div>
              <span className="eyebrow">Source verification</span>
              <h2>Tamper-evident property record</h2>
            </div>
            <dl>
              <div><dt>Property check</dt><dd><StatusBadge status={property.propertyVerificationStatus} /></dd></div>
              <div><dt>Identity check</dt><dd><StatusBadge status={property.identityVerificationStatus} /></dd></div>
              <div><dt>Record</dt><dd><StatusBadge status={property.recordStatus === 'sealed' ? 'sealed' : 'draft'} /></dd></div>
              <div><dt>Last verified</dt><dd>{formatDate(property.verificationTimestamp)}</dd></div>
              <div className="full"><dt>Record ID</dt><dd className="mono">{property.verificationRecordId || 'Pending'}</dd></div>
              <div className="full"><dt>Record hash</dt><dd className="mono">{property.recordHash}</dd></div>
            </dl>
          </article>
        </section>
        <aside className="purchase-card panel">
          <span>{property.marketType === 'rent' ? 'Monthly rent' : 'Asking price'}</span>
          <strong>{formatJod(property.price)}</strong>
          <p>
            {property.marketType === 'rent'
              ? 'Request a structured digital rental contract. Payment happens through a licensed channel — Aqarya never holds funds.'
              : 'Submit a structured offer with price and validity. Registration and payment stay with the competent authorities.'}
          </p>
          {notice ? <div className="inline-alert inline-alert--success">{notice}</div> : null}
          {isVerified ? (
            <button className="button button--primary button--wide" disabled={working} onClick={() => void makeOffer()} type="button">
              {working ? 'Submitting…' : property.marketType === 'rent' ? 'Request rental contract' : 'Make a structured offer'}
            </button>
          ) : (
            <Link className="button button--primary button--wide" to={`/app/messages`}>Contact support</Link>
          )}
          <button className="button button--ghost button--wide" disabled={working} onClick={() => void report()} type="button">
            Report listing
          </button>
        </aside>
      </div>
    </>
  );
}
