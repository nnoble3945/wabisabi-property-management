'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const initial = {
  name: '',
  type: 'PRIMARY',
  addressLine1: '',
  city: '',
  state: 'OR',
  postalCode: '',
};

export default function CreatePropertyForm() {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!result.ok) {
        const body = await result.json().catch(() => ({}));
        throw new Error(body.error || 'Unable to save property');
      }
      setData(initial);
      setExpanded(false);
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unexpected error');
    } finally {
      setBusy(false);
    }
  }

  if (!expanded) {
    return <button className="primary-button" onClick={() => setExpanded(true)}>+ Add property</button>;
  }

  return (
    <form className="new-property" onSubmit={submit}>
      <div className="form-header"><h3>Add a property</h3><button type="button" className="text-button" onClick={() => setExpanded(false)}>Cancel</button></div>
      <div className="form-grid">
        <label>Display name<input required maxLength={120} value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} placeholder="e.g. Welches cabin" /></label>
        <label>Type<select value={data.type} onChange={(e) => setData({ ...data, type: e.target.value })}>
          <option value="PRIMARY">Primary residence</option>
          <option value="LONG_TERM_RENTAL">Long-term rental</option>
          <option value="SHORT_TERM_RENTAL">Cabin / short-term rental</option>
        </select></label>
        <label className="full-width">Street address<input required maxLength={200} value={data.addressLine1} onChange={(e) => setData({ ...data, addressLine1: e.target.value })} /></label>
        <label>City<input required maxLength={100} value={data.city} onChange={(e) => setData({ ...data, city: e.target.value })} /></label>
        <label>State<input required maxLength={50} value={data.state} onChange={(e) => setData({ ...data, state: e.target.value })} /></label>
        <label>ZIP code<input required maxLength={20} value={data.postalCode} onChange={(e) => setData({ ...data, postalCode: e.target.value })} /></label>
      </div>
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="primary-button" disabled={busy}>{busy ? 'Saving...' : 'Save property'}</button>
    </form>
  );
}
