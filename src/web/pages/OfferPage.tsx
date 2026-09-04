import {useEffect, useState, type FormEvent} from 'react';
import {Link, useParams} from 'react-router-dom';
import {
  getPropertyDetails,
  submitStructuredOffer,
  type OfferFundingMethod,
  type StructuredOfferResponse,
} from '../../api/properties';
import {TransactionIcon} from '../TransactionIcon';
import {ErrorState, LoadingState, PropertyCover, formatDate, formatJod} from '../ui';
import {useAsyncData} from '../useAsyncData';

type OfferStep = 1 | 2 | 3;

export function OfferPage() {
  const {id = ''} = useParams();
  const result = useAsyncData(() => getPropertyDetails(id), [id]);
  const [step, setStep] = useState<OfferStep>(1);
  const [amount, setAmount] = useState('');
  const [validForDays, setValidForDays] = useState('7');
  const [fundingMethod, setFundingMethod] = useState<OfferFundingMethod>('cash');
  const [preferredStartDate, setPreferredStartDate] = useState('');
  const [conditions, setConditions] = useState('');
  const [identityConsent, setIdentityConsent] = useState(false);
  const [officialHandoffConsent, setOfficialHandoffConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<StructuredOfferResponse | null>(null);

  useEffect(() => {
    if (result.data && !amount) setAmount(String(result.data.price));
  }, [amount, result.data]);

  if (result.loading) return <LoadingState label="Preparing the transaction workspace…" />;
  if (result.error) return <ErrorState message={result.error} retry={result.refresh} />;
  const property = result.data;
  if (!property) return null;

  const isRental = property.marketType === 'rent';

  if (property.viewerIsOwner || property.verificationStatus !== 'verified') {
    return (
      <div className="transaction-unavailable">
        <span><TransactionIcon name="shield" /></span>
        <h1>{property.viewerIsOwner ? 'This is your property' : 'Offer unavailable'}</h1>
        <p>{property.viewerIsOwner ? 'Manage this record and its listing from your property portfolio.' : 'This listing must be verified before it can receive structured offers.'}</p>
        <Link className="transaction-primary" to={property.viewerIsOwner ? '/app/my-properties' : `/app/property/${property.id}`}>
          {property.viewerIsOwner ? 'Open my portfolio' : 'Return to property'}<TransactionIcon name="arrow" />
        </Link>
      </div>
    );
  }

  if (receipt) {
    return (
      <div className="transaction-success">
        <span className="transaction-success__seal"><TransactionIcon name="check" /></span>
        <span className="eyebrow">Submission recorded</span>
        <h1>{isRental ? 'Rental request sent' : 'Your offer is on the record'}</h1>
        <p>{receipt.message}</p>
        <div className="transaction-receipt">
          <div><span>Reference</span><strong className="mono">{receipt.reference}</strong></div>
          <div><span>Submitted</span><strong>{formatDate(receipt.submittedAt)}</strong></div>
          <div><span>Status</span><strong>Awaiting owner review</strong></div>
        </div>
        <section>
          <h2>What happens next</h2>
          <ol>{receipt.nextSteps.map((item, index) => <li key={item}><i>{index + 1}</i><span>{item}</span></li>)}</ol>
        </section>
        <div className="transaction-success__actions">
          <Link className="transaction-primary" to="/app/messages">Open messages<TransactionIcon name="arrow" /></Link>
          <Link className="transaction-secondary" to={`/app/property/${property.id}`}>Back to property</Link>
        </div>
      </div>
    );
  }

  const continueTo = (next: OfferStep) => {
    setError('');
    if (step === 1 && (!Number.isFinite(Number(amount)) || Number(amount) <= 0)) {
      setError(`Enter a valid ${isRental ? 'monthly amount' : 'offer amount'}.`);
      return;
    }
    setStep(next);
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!identityConsent || !officialHandoffConsent) {
      setError('Confirm both statements before submitting.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const response = await submitStructuredOffer(property.id, {
        amount: Number(amount),
        validForDays: Number(validForDays),
        fundingMethod,
        preferredStartDate: preferredStartDate || undefined,
        conditions: conditions.trim() || undefined,
        identityConsent,
        officialHandoffConsent,
      });
      setReceipt(response);
      window.scrollTo({top: 0, behavior: 'smooth'});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="transaction-page">
      <header className="transaction-page__header">
        <Link className="transaction-back" to={`/app/property/${property.id}`}><TransactionIcon name="back" />Property details</Link>
        <span className="transaction-secure"><TransactionIcon name="lock" />Protected transaction workspace</span>
      </header>

      <div className="transaction-heading">
        <span className="eyebrow">{isRental ? 'Structured rental request' : 'Structured purchase offer'}</span>
        <h1>{isRental ? 'Request this home' : 'Prepare your offer'}</h1>
        <p>Clear terms first. Official payment and registration only after acceptance.</p>
      </div>

      <ol className="transaction-progress" aria-label="Transaction progress">
        {['Terms', 'Conditions', 'Review'].map((label, index) => {
          const number = (index + 1) as OfferStep;
          return <li className={number === step ? 'is-current' : number < step ? 'is-complete' : ''} key={label}><span>{number < step ? <TransactionIcon name="check" /> : number}</span><strong>{label}</strong></li>;
        })}
      </ol>

      <div className="transaction-layout">
        <form className="transaction-form" onSubmit={submit}>
          {step === 1 ? (
            <section className="transaction-panel">
              <div className="transaction-panel__title"><span><TransactionIcon name="wallet" /></span><div><h2>{isRental ? 'Rental terms' : 'Offer terms'}</h2><p>Set the commercial terms the owner will review.</p></div></div>
              <div className="transaction-fields">
                <label>{isRental ? 'Proposed monthly rent' : 'Offer amount'}<div className="money-input"><span>JOD</span><input inputMode="numeric" min="1" onChange={event => setAmount(event.target.value)} required type="number" value={amount} /></div></label>
                <label>Offer valid for<select onChange={event => setValidForDays(event.target.value)} value={validForDays}><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label>
                <label>Funding approach<select onChange={event => setFundingMethod(event.target.value as OfferFundingMethod)} value={fundingMethod}><option value="cash">Available funds</option><option value="bank_financing">Bank financing</option><option value="mixed">Funds + financing</option></select></label>
                {isRental ? <label>Preferred move-in date<input min={new Date().toISOString().slice(0, 10)} onChange={event => setPreferredStartDate(event.target.value)} type="date" value={preferredStartDate} /></label> : null}
              </div>
              <div className="transaction-callout"><TransactionIcon name="shield" /><p><strong>No payment is made now.</strong> Your terms are recorded for review; Aqarya does not hold customer funds.</p></div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="transaction-panel">
              <div className="transaction-panel__title"><span><TransactionIcon name="document" /></span><div><h2>Conditions and timing</h2><p>Add only the details the owner needs to assess the request.</p></div></div>
              <label>Conditions or note <small>Optional</small><textarea maxLength={600} onChange={event => setConditions(event.target.value)} placeholder={isRental ? 'For example: preferred lease length or move-in flexibility' : 'For example: subject to financing approval or an inspection'} rows={6} value={conditions} /><span className="field-count">{conditions.length}/600</span></label>
              <div className="transaction-info-grid">
                <div><TransactionIcon name="shield" /><strong>Identity-linked</strong><p>Your verified account is attached to the submission.</p></div>
                <div><TransactionIcon name="document" /><strong>Time-stamped</strong><p>Terms and responses become part of the audit trail.</p></div>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className="transaction-panel">
              <div className="transaction-panel__title"><span><TransactionIcon name="check" /></span><div><h2>Review and confirm</h2><p>Nothing here transfers ownership or moves money.</p></div></div>
              <dl className="transaction-review">
                <div><dt>{isRental ? 'Monthly amount' : 'Offer amount'}</dt><dd>{formatJod(Number(amount))}</dd></div>
                <div><dt>Valid for</dt><dd>{validForDays} days</dd></div>
                <div><dt>Funding</dt><dd>{fundingMethod.replaceAll('_', ' ')}</dd></div>
                {preferredStartDate ? <div><dt>Preferred start</dt><dd>{formatDate(preferredStartDate)}</dd></div> : null}
                <div><dt>Conditions</dt><dd>{conditions.trim() || 'No additional conditions'}</dd></div>
              </dl>
              <div className="transaction-consents">
                <label><input checked={identityConsent} onChange={event => setIdentityConsent(event.target.checked)} type="checkbox" /><span><strong>Identity confirmation</strong><small>I consent to attaching my verified Aqarya identity to this request.</small></span></label>
                <label><input checked={officialHandoffConsent} onChange={event => setOfficialHandoffConsent(event.target.checked)} type="checkbox" /><span><strong>Official-process confirmation</strong><small>I understand acceptance is followed by licensed payment and official registration steps outside Aqarya where required.</small></span></label>
              </div>
            </section>
          ) : null}

          {error ? <div className="transaction-error" role="alert">{error}</div> : null}
          <footer className="transaction-form__actions">
            {step > 1 ? <button className="transaction-secondary" onClick={() => continueTo((step - 1) as OfferStep)} type="button"><TransactionIcon name="back" />Back</button> : <span />}
            {step < 3 ? <button className="transaction-primary" onClick={() => continueTo((step + 1) as OfferStep)} type="button">Continue<TransactionIcon name="arrow" /></button> : <button className="transaction-primary" disabled={submitting} type="submit">{submitting ? 'Recording offer…' : isRental ? 'Submit rental request' : 'Submit offer'}<TransactionIcon name="arrow" /></button>}
          </footer>
        </form>

        <aside className="transaction-summary">
          <div className="transaction-summary__media"><PropertyCover property={property} /></div>
          <div className="transaction-summary__body">
            <span>{isRental ? 'Rental request for' : 'Purchase offer for'}</span>
            <h2>{property.title}</h2>
            <p><TransactionIcon name="pin" />{property.location}</p>
            <dl><div><dt>Listed price</dt><dd>{formatJod(property.price)}{isRental ? '/mo' : ''}</dd></div><div><dt>Record</dt><dd className="mono">{property.recordHash}</dd></div></dl>
            <span className="transaction-summary__verified"><TransactionIcon name="shield" />Property and advertiser verified</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
