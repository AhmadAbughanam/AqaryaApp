import {useState, type FormEvent} from 'react';
import {Link, useNavigate, useSearchParams} from 'react-router-dom';
import {createSaleListing} from '../../api/properties';
import {PageHeader} from '../ui';

export function SellPropertyPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const property = await createSaleListing({
        sourcePropertyId: params.get('source') || undefined,
        title: String(data.get('title')),
        location: String(data.get('location')),
        city: String(data.get('city')),
        ownerName: String(data.get('ownerName')),
        ownershipType: String(data.get('ownershipType')),
        ownershipProofType: String(data.get('ownershipProofType')),
        ownershipProofNumber: String(data.get('ownershipProofNumber')),
        description: String(data.get('description')),
        propertyType: String(data.get('propertyType')),
        price: Number(data.get('price')),
        propertyValue: Number(data.get('propertyValue')),
        bedrooms: Number(data.get('bedrooms')) || undefined,
        bathrooms: Number(data.get('bathrooms')) || undefined,
        areaSqm: Number(data.get('areaSqm')) || undefined,
      });
      navigate(`/app/property/${property.id}`, {replace: true});
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not submit listing.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader title="List a property for sale" action={<Link className="button button--secondary" to="/app/my-properties">Cancel</Link>} />
      <form className="panel form-panel" onSubmit={submit}>
        <div className="form-section"><span className="eyebrow">1 · Property</span><h2>Property details</h2></div>
        <div className="form-grid">
          <label className="span-2">Listing title<input name="title" placeholder="e.g. Modern apartment in Abdoun" required /></label>
          <label>City<input name="city" placeholder="Amman" required /></label>
          <label>Full location<input name="location" placeholder="City, neighborhood" required /></label>
          <label>Property type<select name="propertyType" required><option>Apartment</option><option>Villa</option><option>Commercial</option><option>Land</option></select></label>
          <label>Area (m²)<input min="1" name="areaSqm" type="number" /></label>
          <label>Bedrooms<input min="0" name="bedrooms" type="number" /></label>
          <label>Bathrooms<input min="0" name="bathrooms" type="number" /></label>
          <label className="span-2">Description<textarea name="description" rows={5} required /></label>
        </div>
        <div className="form-section"><span className="eyebrow">2 · Ownership</span><h2>Proof of ownership</h2></div>
        <div className="form-grid">
          <label>Owner name<input name="ownerName" required /></label>
          <label>Ownership type<select name="ownershipType"><option>Freehold</option><option>Leasehold</option><option>Shared ownership</option></select></label>
          <label>Proof type<select name="ownershipProofType"><option value="title_deed">Title deed</option><option value="municipal_record">Municipal record</option></select></label>
          <label>Proof number<input name="ownershipProofNumber" required /></label>
          <label>Estimated property value<input min="1" name="propertyValue" required type="number" /></label>
          <label>Asking price<input min="1" name="price" required type="number" /></label>
        </div>
        {error ? <div className="inline-alert" role="alert">{error}</div> : null}
        <div className="form-actions"><button className="button button--primary" disabled={submitting} type="submit">{submitting ? 'Submitting…' : 'Submit for verification'}</button></div>
      </form>
    </>
  );
}
