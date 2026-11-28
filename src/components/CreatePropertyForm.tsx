'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PropertyRecord } from '@/lib/properties';

type PropertyType = PropertyRecord['PropertyType'];
type Draft = {
  name: string;
  type: PropertyType;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
  acquisitionDate: string;
  purchasePrice: string;
};

function initialDraft(property?: PropertyRecord): Draft {
  return {
    name: property?.Name ?? '',
    type: property?.PropertyType ?? 'PRIMARY',
    addressLine1: property?.AddressLine1 ?? '',
    city: property?.City ?? '',
    state: property?.State ?? 'OR',
    postalCode: property?.PostalCode ?? '',
    acquisitionDate: property?.AcquisitionDate ?? '',
    purchasePrice: property?.PurchasePrice == null ? '' : String(property.PurchasePrice),
  };
}

export default function CreatePropertyForm({ property }: { property?: PropertyRecord }) {
  const router = useRouter();
  const [data, setData] = useState<Draft>(() => initialDraft(property));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const editing = Boolean(property);

  function close() {
    setExpanded(false);
    setError(null);
    setData(initialDraft(property));
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      const result = await fetch(editing ? `/api/properties/${property!.PropertyId}` : '/api/properties', {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          acquisitionDate: data.acquisitionDate || null,
          purchasePrice: data.purchasePrice === '' ? null : Number(data.purchasePrice),
        }),
      });
      if (!result.ok) {
        const body = await result.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to save property');
      }
      close();
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }

  if (!expanded) {
    return <button className="primary-button" onClick={() => setExpanded(true)}>
      {editing ? 'Edit property' : '+ Add property'}
    </button>;
  }

  return (
    <form className="new-property" onSubmit={submit}>
      <div className="form-header">
        <h3>{editing ? 'Edit property profile' : 'Add a property'}</h3>
        <button type="button" className="text-button" onClick={close} disabled={busy}>Cancel</button>
      </div>
      <div className="form-grid">
        <label>Display name<input required maxLength={120} value={data.name} onChange={e => setData({ ...data, name: e.target.value })}/></label>
        <label>Type<select value={data.type} onChange={e => setData({ ...data, type: e.target.value as PropertyType })}>
          <option value="PRIMARY">Primary residence</option>
          <option value="LONG_TERM_RENTAL">Long-term rental</option>
          <option value="SHORT_TERM_RENTAL">Cabin / short-term rental</option>
        </select></label>
        <label className="full-width">Street address<input required maxLength={200} value={data.addressLine1} onChange={e => setData({ ...data, addressLine1: e.target.value })}/></label>
        <label>City<input required maxLength={100} value={data.city} onChange={e => setData({ ...data, city: e.target.value })}/></label>
        <label>State<input required maxLength={50} value={data.state} onChange={e => setData({ ...data, state: e.target.value })}/></label>
        <label>ZIP code<input required maxLength={20} value={data.postalCode} onChange={e => setData({ ...data, postalCode: e.target.value })}/></label>
        <label>Acquisition date (optional)<input type="date" value={data.acquisitionDate} onChange={e => setData({ ...data, acquisitionDate: e.target.value })}/></label>
        <label>Purchase price (optional)<input type="number" min="0" step="0.01" value={data.purchasePrice} onChange={e => setData({ ...data, purchasePrice: e.target.value })}/></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="primary-button" disabled={busy}>
        {busy ? 'Saving...' : editing ? 'Save changes' : 'Save property'}
      </button>
    </form>
  );
}
