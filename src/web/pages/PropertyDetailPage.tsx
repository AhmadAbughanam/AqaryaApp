import {useState} from 'react';
import {Link, useParams} from 'react-router-dom';
import {buyPropertyWithWallet, getPropertyDetails} from '../../api/properties';
import {reportListing, type ReportReason} from '../../api/moderation';
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

  async function purchase() {
    if (!window.confirm('Confirm this purchase using your eJOD wallet?')) return;
    setWorking(true);
    setNotice('');
    try {
      const response = await buyPropertyWithWallet(id);
      setNotice(response.message || 'Purchase completed successfully.');
      result.refresh();
    } catch (reason) {
      setNotice(reason instanceof Error ? reason.message : 'Purchase failed.');
    } finally {
      setWorking(false);
    }
  }

  async function report(reason: ReportReason) {
    setWorking(true);
    try {
      await reportListing(id, {reason});
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

  return (
    <>
      <PageHeader
        eyebrow={property.marketType}
        title={property.title}
        description={property.location}
        action={<Link className="button button--secondary" to="/app">Back to marketplace</Link>}
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
              <span className="eyebrow">Digital verification</span>
              <h2>Tamper-evident property record</h2>
            </div>
            <dl>
              <div><dt>Property check</dt><dd><StatusBadge status={property.propertyVerificationStatus} /></dd></div>
              <div><dt>Identity check</dt><dd><StatusBadge status={property.identityVerificationStatus} /></dd></div>
              <div><dt>Blockchain</dt><dd><StatusBadge status={property.blockchainStatus} /></dd></div>
              <div><dt>Last verified</dt><dd>{formatDate(property.verificationTimestamp)}</dd></div>
              <div className="full"><dt>Record ID</dt><dd className="mono">{property.verificationRecordId || 'Pending'}</dd></div>
            </dl>
          </article>
        </section>
        <aside className="purchase-card panel">
          <span>{property.marketType === 'rent' ? 'Monthly rent' : 'Asking price'}</span>
          <strong>{formatJod(property.price)}</strong>
          <p>Pay securely with your eJOD wallet. All transactions are recorded in your account.</p>
          {notice ? <div className="inline-alert inline-alert--success">{notice}</div> : null}
          {property.marketType === 'sale' && property.verificationStatus === 'verified' ? (
            <button className="button button--primary button--wide" disabled={working} onClick={() => void purchase()} type="button">
              {working ? 'Processing…' : 'Buy with eJOD'}
            </button>
          ) : (
            <Link className="button button--primary button--wide" to={`/app/messages?listing=${property.id}`}>Contact support</Link>
          )}
          <button className="button button--ghost button--wide" disabled={working} onClick={() => void report('misleading_info')} type="button">
            Report listing
          </button>
        </aside>
      </div>
    </>
  );
}
