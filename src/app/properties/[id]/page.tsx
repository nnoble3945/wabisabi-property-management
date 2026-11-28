import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import RetryDatabaseButton from '@/components/RetryDatabaseButton';
import { isTransientSqlError } from '@/lib/sql-resilience.mjs';
import CreatePropertyForm from '@/components/CreatePropertyForm';
import { isAuthorized } from '@/lib/auth';
import { databaseConfigured } from '@/lib/db';
import { getProperty } from '@/lib/properties';
import { propertyIdSchema } from '@/lib/schemas';
import { getPropertyTypeLabel, money } from '@/lib/labels.mjs';

export const dynamic = 'force-dynamic';

export default async function PropertyDetails({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthorized())) redirect('/unauthorized');
  const { id } = await params;
  if (!propertyIdSchema.safeParse(id).success) notFound();

  if (!databaseConfigured()) {
    return <main className="center-panel"><div className="notice error">Azure SQL is not configured.</div></main>;
  }
  let property;
  try {
    property = await getProperty(id);
  } catch (error) {
    console.error('Property detail error', error);
    if (isTransientSqlError(error)) {
      return <main className="center-panel"><div className="notice" role="status"><strong>Database temporarily unavailable</strong><p>Azure SQL may be resuming after inactivity. Please try again shortly.</p><RetryDatabaseButton /></div></main>;
    }
    return <main className="center-panel"><div className="notice error" role="alert">Unable to load this property. Check Azure SQL connectivity and server logs.</div></main>;
  }
  if (!property) notFound();

  const acquired = property.AcquisitionDate
    ? new Date(`${property.AcquisitionDate}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not recorded';

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">
        <div className="topbar">
          <Link className="property-back-link" href="/">Wabi Sabi / Portfolio</Link>
          <span className="user-pill">PRIVATE ACCOUNT</span>
        </div>
        <header className="page-heading">
          <div>
            <div className="eyebrow">PROPERTY PROFILE</div>
            <h1>{property.Name}</h1>
            <p>{property.AddressLine1}, {property.City}, {property.State} {property.PostalCode}</p>
          </div>
        </header>
        <div className="profile-layout">
          <section className="panel">
            <h2>Property information</h2>
            <dl className="profile-grid">
              <div><dt>Property type</dt><dd>{getPropertyTypeLabel(property.PropertyType)}</dd></div>
              <div><dt>Display name</dt><dd>{property.Name}</dd></div>
              <div><dt>Street address</dt><dd>{property.AddressLine1}</dd></div>
              <div><dt>City</dt><dd>{property.City}</dd></div>
              <div><dt>State</dt><dd>{property.State}</dd></div>
              <div><dt>ZIP code</dt><dd>{property.PostalCode}</dd></div>
              <div><dt>Acquisition date</dt><dd>{acquired}</dd></div>
              <div><dt>Purchase price</dt><dd>{property.PurchasePrice == null ? 'Not recorded' : money(property.PurchasePrice)}</dd></div>
            </dl>
          </section>
          <section className="panel">
            <div className="profile-edit-heading">
              <div><h2>Manage profile</h2><p>Keep this record current as your portfolio evolves.</p></div>
              <CreatePropertyForm key={property.PropertyId} property={property} />
            </div>
          </section>
        </div>
        <footer className="footer">Wabi Sabi Property Management · Secure personal portfolio workspace</footer>
      </main>
    </div>
  );
}
