import {useEffect, useState} from 'react';
import {Link, useSearchParams} from 'react-router-dom';
import {getMyProfile, type OwnedProfileProperty} from '../../api/profile';
import {createSaleListing, type PropertyListItem} from '../../api/properties';
import {TransactionIcon} from '../TransactionIcon';
import {ErrorState, LoadingState, PropertyCover, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

type ListingStep = 1 | 2 | 3;

const canActivateListing = (property: OwnedProfileProperty) =>
  property.verificationStatus === 'verified' &&
  property.identityVerificationStatus === 'verified' &&
  property.recordStatus === 'sealed';

export function SellPropertyPage() {
  const [params] = useSearchParams();
  const requestedSource = params.get('source') || '';
  const result = useAsyncData(getMyProfile);
  const [step, setStep] = useState<ListingStep>(requestedSource ? 2 : 1);
  const [selectedId, setSelectedId] = useState(requestedSource);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [validForDays, setValidForDays] = useState('30');
  const [accuracyConfirmed, setAccuracyConfirmed] = useState(false);
  const [reviewConsent, setReviewConsent] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedProperty, setSubmittedProperty] = useState<PropertyListItem | null>(null);

  const properties = result.data?.ownedProperties ?? [];
  const selected = properties.find(property => property.id === selectedId);

  useEffect(() => {
    if (!selected || title) return;
    setTitle(selected.title);
    setDescription(selected.description ?? '');
    setPrice(String(selected.price || selected.propertyValue));
  }, [selected, title]);

  if (result.loading) return <LoadingState label="Loading your verified property records…" />;
  if (result.error) return <ErrorState message={result.error} retry={result.refresh} />;

  const chooseProperty = (property: OwnedProfileProperty) => {
    if (!canActivateListing(property)) return;
    setSelectedId(property.id);
    setTitle(property.title);
    setDescription(property.description);
    setPrice(String(property.price || property.propertyValue));
    setError('');
    setStep(2);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const continueToReview = () => {
    if (!selected || !canActivateListing(selected)) {
      setError('Choose an eligible verified property record first.');
      setStep(1);
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError('Add a public headline and description.');
      return;
    }
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      setError('Enter a valid asking price.');
      return;
    }
    setError('');
    setStep(3);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const submit = async () => {
    if (!selected || !accuracyConfirmed || !reviewConsent) {
      setError('Confirm both statements before submitting the listing.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const property = await createSaleListing({
        sourcePropertyId: selected.id,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        validForDays: Number(validForDays),
      });
      setSubmittedProperty(property);
      window.scrollTo({top: 0, behavior: 'smooth'});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The listing could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedProperty) {
    return (
      <div className="transaction-success listing-success">
        <span className="transaction-success__seal"><TransactionIcon name="check" /></span>
        <span className="eyebrow">Verification requested</span>
        <h1>Your listing is now in review</h1>
        <p>Aqarya kept the property tied to its existing source record and submitted only the market details for review.</p>
        <div className="listing-success__property"><span><PropertyCover property={submittedProperty} /></span><div><strong>{submittedProperty.title}</strong><small>{submittedProperty.location}</small><b>{formatJod(submittedProperty.price)}</b></div></div>
        <section>
          <h2>What happens next</h2>
          <ol>
            <li><i>1</i><span>Listing details are checked against the sealed property record.</span></li>
            <li><i>2</i><span>You receive a notification if changes or additional authorization are needed.</span></li>
            <li><i>3</i><span>The listing becomes publicly discoverable only after verification.</span></li>
          </ol>
        </section>
        <div className="transaction-success__actions"><Link className="transaction-primary" to={`/app/property/${submittedProperty.id}`}>Track verification<TransactionIcon name="arrow" /></Link><Link className="transaction-secondary" to="/app/my-properties">My properties</Link></div>
      </div>
    );
  }

  return (
    <div className="transaction-page listing-flow">
      <header className="transaction-page__header">
        <Link className="transaction-back" to="/app/my-properties"><TransactionIcon name="back" />My properties</Link>
        <span className="transaction-secure"><TransactionIcon name="lock" />SANAD-linked owner journey</span>
      </header>
      <div className="transaction-heading">
        <span className="eyebrow">Activate a market listing</span>
        <h1>List from a verified record</h1>
        <p>Select a property already linked to your portfolio, then add only the market details.</p>
      </div>
      <ol className="transaction-progress" aria-label="Listing progress">
        {['Property', 'Listing', 'Review'].map((label, index) => {
          const number = (index + 1) as ListingStep;
          return <li className={number === step ? 'is-current' : number < step ? 'is-complete' : ''} key={label}><span>{number < step ? <TransactionIcon name="check" /> : number}</span><strong>{label}</strong></li>;
        })}
      </ol>

      <div className="listing-layout">
        <main>
          {step === 1 ? (
            <section className="transaction-panel">
              <div className="transaction-panel__title"><span><TransactionIcon name="building" /></span><div><h2>Choose the source property</h2><p>Ownership, location and record identity stay locked to the source.</p></div></div>
              <div className="listing-records">
                {properties.map(property => {
                  const eligible = canActivateListing(property);
                  return (
                    <button className={eligible ? '' : 'is-disabled'} disabled={!eligible} key={property.id} onClick={() => chooseProperty(property)} type="button">
                      <span className="listing-records__media"><PropertyCover property={property} /></span>
                      <span className="listing-records__body"><small>{property.propertyType} · {property.areaSqm ? `${property.areaSqm} m²` : 'Area unavailable'}</small><strong>{property.title}</strong><span><TransactionIcon name="pin" />{property.location}</span><b className={eligible ? 'is-eligible' : ''}>{eligible ? 'Ready to list' : 'Verification required'}</b></span>
                      <TransactionIcon name="chevron" />
                    </button>
                  );
                })}
              </div>
              {!properties.length ? <div className="listing-empty"><TransactionIcon name="home" /><h3>No linked property records</h3><p>A property must first appear in your authoritative portfolio before it can be listed.</p><Link to="/app/help">Contact support</Link></div> : null}
            </section>
          ) : null}

          {step === 2 && selected ? (
            <section className="transaction-panel">
              <div className="transaction-panel__title"><span><TransactionIcon name="sparkle" /></span><div><h2>Add the market details</h2><p>The underlying property data cannot be changed here.</p></div></div>
              <div className="listing-source-lock"><TransactionIcon name="lock" /><div><span>Linked source record</span><strong>{selected.title}</strong><small className="mono">{selected.recordReference}</small></div><button onClick={() => setStep(1)} type="button">Change</button></div>
              <div className="transaction-fields">
                <label className="span-2">Public headline<input maxLength={90} onChange={event => setTitle(event.target.value)} required value={title} /><span className="field-count">{title.length}/90</span></label>
                <label>Asking price<div className="money-input"><span>JOD</span><input inputMode="numeric" min="1" onChange={event => setPrice(event.target.value)} required type="number" value={price} /></div></label>
                <label>Listing validity<select onChange={event => setValidForDays(event.target.value)} value={validForDays}><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option><option value="60">60 days</option><option value="90">90 days</option></select></label>
                <label className="span-2">Public description<textarea maxLength={900} onChange={event => setDescription(event.target.value)} required rows={7} value={description} /><span className="field-count">{description.length}/900</span></label>
              </div>
              <div className="transaction-callout"><TransactionIcon name="shield" /><p><strong>Source fields stay protected.</strong> Owner identity, location, property type and verification references come from your linked record.</p></div>
            </section>
          ) : null}

          {step === 3 && selected ? (
            <section className="transaction-panel">
              <div className="transaction-panel__title"><span><TransactionIcon name="check" /></span><div><h2>Review before verification</h2><p>Your listing will not publish until its market details are approved.</p></div></div>
              <div className="listing-review-card"><span><PropertyCover property={selected} /></span><div><small>For sale · {selected.propertyType}</small><h3>{title}</h3><p><TransactionIcon name="pin" />{selected.location}</p><strong>{formatJod(Number(price))}</strong></div></div>
              <dl className="transaction-review"><div><dt>Source record</dt><dd className="mono">{selected.recordReference}</dd></div><div><dt>Owner</dt><dd>{result.data?.user.username}</dd></div><div><dt>Listing validity</dt><dd>{validForDays} days</dd></div><div><dt>Publication</dt><dd>After verification</dd></div></dl>
              <div className="transaction-consents">
                <label><input checked={accuracyConfirmed} onChange={event => setAccuracyConfirmed(event.target.checked)} type="checkbox" /><span><strong>Listing accuracy</strong><small>I confirm the market description and asking price are current and accurate.</small></span></label>
                <label><input checked={reviewConsent} onChange={event => setReviewConsent(event.target.checked)} type="checkbox" /><span><strong>Verification consent</strong><small>I consent to checking these details against the linked property and identity records.</small></span></label>
              </div>
            </section>
          ) : null}

          {error ? <div className="transaction-error" role="alert">{error}</div> : null}
          <footer className="transaction-form__actions">
            {step > 1 ? <button className="transaction-secondary" onClick={() => { setError(''); setStep((step - 1) as ListingStep); }} type="button"><TransactionIcon name="back" />Back</button> : <span />}
            {step === 2 ? <button className="transaction-primary" onClick={continueToReview} type="button">Review listing<TransactionIcon name="arrow" /></button> : null}
            {step === 3 ? <button className="transaction-primary" disabled={submitting} onClick={() => void submit()} type="button">{submitting ? 'Submitting…' : 'Submit for verification'}<TransactionIcon name="arrow" /></button> : null}
          </footer>
        </main>

        <aside className="listing-principles">
          <span className="listing-principles__seal">A</span>
          <span className="eyebrow">Aqarya listing standard</span>
          <h2>Source first. Listing second.</h2>
          <p>Aqarya activates market offers from authenticated property records instead of creating anonymous advertisements.</p>
          <ul><li><TransactionIcon name="check" />Verified owner or authorization</li><li><TransactionIcon name="check" />Sealed property source</li><li><TransactionIcon name="check" />Review before publication</li><li><TransactionIcon name="check" />Time-stamped activity trail</li></ul>
        </aside>
      </div>
    </div>
  );
}
