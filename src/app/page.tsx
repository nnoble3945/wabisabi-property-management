import { redirect } from 'next/navigation';
import CreatePropertyForm from '@/components/CreatePropertyForm';
import Sidebar from '@/components/Sidebar';
import RetryDatabaseButton from '@/components/RetryDatabaseButton';
import { isTransientSqlError } from '@/lib/sql-resilience.mjs';
import { isAuthorized } from '@/lib/auth';
import { databaseConfigured } from '@/lib/db';
import { listProperties, type PropertyRecord } from '@/lib/properties';
import { getPropertyTypeLabel } from '@/lib/labels.mjs';
import Link from "next/link";

export const dynamic = 'force-dynamic';

function iconFor(type: PropertyRecord['PropertyType']) {
  return type === 'PRIMARY' ? '⌂' : type === 'SHORT_TERM_RENTAL' ? '♧' : '▣';
}

export default async function Dashboard() {
  if (!(await isAuthorized())) redirect('/unauthorized');

  const configured = databaseConfigured();
  let properties: PropertyRecord[] = [];
  let dbError: 'transient' | 'permanent' | null = null;
  if (configured) {
    try { properties = await listProperties(); }
    catch (error) { console.error('Dashboard data error', error); dbError = isTransientSqlError(error) ? 'transient' : 'permanent'; }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="content">
        <div className="topbar"><span>Wabi Sabi / Portfolio</span><span className="user-pill">PRIVATE ACCOUNT</span></div>
        <header className="page-heading"><div><div className="eyebrow">PORTFOLIO OPERATIONS</div><h1>Your properties</h1><p>One place to track the homes, rentals, and the work that keeps them running.</p></div></header>
        <section className="stats" aria-label="Portfolio summary">
          <div className="stat"><span className="stat-label">Properties</span><strong>{dbError ? '—' : properties.length}</strong><span className="stat-foot">in your portfolio</span></div>
          <div className="stat"><span className="stat-label">Maintenance</span><strong>—</strong><span className="stat-foot">coming in the next feature</span></div>
          <div className="stat"><span className="stat-label">Cash flow</span><strong>—</strong><span className="stat-foot">financial module planned</span></div>
        </section>
        {!configured && <div className="notice"><strong>Azure SQL setup required</strong><p>The interface is working, but the database is not connected. Set AZURE_SQL_SERVER and AZURE_SQL_DATABASE after provisioning Azure SQL, then run sql/001_init.sql.</p></div>}
        {dbError === 'transient' && <div className="notice" role="status"><strong>Database temporarily unavailable</strong><p>Azure SQL may be resuming after inactivity. We retried the connection automatically, but it is not ready yet. Please try again shortly.</p><RetryDatabaseButton /></div>}
        {dbError === 'permanent' && <div className="notice error" role="alert"><strong>Database connection or schema error</strong><p>Check Azure credentials, firewall/network access, database user permissions, and whether sql/001_init.sql has run. Server logs contain the technical detail.</p></div>}
        <section className="panel property-panel"><div className="panel-heading"><div><h2>Property portfolio</h2><p>Manage your primary home, long-term rental, and cabin.</p></div>{configured && !dbError && <CreatePropertyForm />}</div>
          <div className="property-list">
            {properties.map((p) => <div className="property" key={p.PropertyId}><div className="property-icon">{iconFor(p.PropertyType)}</div><div className="property-details"><Link className="property-name-link" href={`/properties/${p.PropertyId}`}>{p.Name}</Link><span>{p.AddressLine1}, {p.City}, {p.State} {p.PostalCode}</span></div><span className="type-pill">{getPropertyTypeLabel(p.PropertyType)}</span></div>)}
            {properties.length === 0 && !dbError && <div className="empty-state"><div className="empty-icon">⌂</div><strong>No properties added yet</strong><p>{configured && !dbError ? 'Create your first property to start building your portfolio.' : 'Configure Azure SQL to begin storing property records.'}</p></div>}
          </div>
        </section>
        <footer className="footer">Wabi Sabi Property Management · Secure personal portfolio workspace</footer>
      </main>
    </div>
  );
}
