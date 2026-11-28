import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand"><div className="brand-symbol">N</div><div><strong>Wabi Sabi</strong><span>PROPERTY MANAGEMENT</span></div></div>
      <div className="sidebar-group">WORKSPACE</div>
      <nav aria-label="Primary navigation">
        <Link className="sidebar-link active" href="/">◫ <span>Portfolio Overview</span></Link>
        <span className="sidebar-link disabled" aria-disabled="true">⌂ <span>Maintenance <small>Next</small></span></span>
        <span className="sidebar-link disabled" aria-disabled="true">↗ <span>Financials <small>Planned</small></span></span>
        <span className="sidebar-link disabled" aria-disabled="true">▤ <span>Documents <small>Planned</small></span></span>
      </nav>
      <div className="sidebar-footer">PRIVATE PORTFOLIO<br/><span>Release 0.2 · Property Records</span></div>
    </aside>
  );
}
