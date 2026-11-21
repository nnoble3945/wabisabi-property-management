export default function Unauthorized() {
  return (
    <main className="center-panel">
      <div className="panel">
        <div className="eyebrow">Noble Property Management</div>
        <h1>Private access only</h1>
        <p>You are not authorized. In local development, set DEV_AUTH_BYPASS=true in .env.local. In production, configure Azure App Service authentication and your Entra principal allowlist.</p>
      </div>
    </main>
  );
}
