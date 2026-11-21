# Noble Property Management

A private Azure-backed application for three properties: primary residence, long-term rental, and cabin / short-term rental.

**Current increment (Release 0.1):** Next.js application skeleton, guarded portfolio dashboard, SQL connection layer, property-list/create API, initial migration, local unit tests, and Azure Pipelines CI draft.

**Not yet built:** maintenance UI, financial ledger UI, mortgage/valuation screens, document uploads, guest calendar, deployment infrastructure, and automated integration tests. These should remain open in Azure Boards.

## Requirements
- Node.js 24 LTS and npm
- Azure subscription + Azure SQL database (only when connecting real data)
- Microsoft Entra identity and, for Azure App Service deployment, Easy Auth

## First-time local setup

```bash
npm install                      # generates package-lock.json; commit the lockfile
cp .env.example .env.local       # Windows PowerShell: Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000. Without an Azure SQL database, the UI displays a setup-required message and does not show fabricated property data. The endpoint `/api/health` reports whether SQL variables are configured.

`DEV_AUTH_BYPASS=true` works **only** with `NODE_ENV=development`. Never place this variable in App Service. The application denies access outside local development until Azure auth and the explicit allowlist are configured.

## Configure Azure SQL
1. Create a dedicated Azure resource group, SQL logical server, and Azure SQL database. Select the lowest appropriate tier after checking prices.
2. Set a Microsoft Entra admin on the SQL server. Configure a restricted firewall/private network route. Do not add an unrestricted public firewall rule.
3. Execute `sql/001_init.sql` against the database using Azure Data Studio, SSMS, or `sqlcmd` under a migration-authorized account.
4. In `.env.local` set `AZURE_SQL_SERVER` to `yourserver.database.windows.net` and `AZURE_SQL_DATABASE` to the database name.
5. For local Microsoft Entra auth, `az login` with an identity that has SQL read/write permissions. Alternatively, in **local development only**, set `SQL_USER` and `SQL_PASSWORD` for a least-privilege SQL user.
6. Run `npm run dev`. Add your first property from the portfolio dashboard.

**Production managed identity:** After enabling a system-assigned identity for App Service, create a contained database user for the managed identity and grant only the needed table permissions (`db_datareader` and `db_datawriter` initially; use narrower permissions later). Grant DDL permissions only to the migration identity, not to the running application. The SQL server must have Microsoft Entra authentication enabled.

## Production security gate (required)
1. App Service > Authentication > Microsoft Entra ID > **Require authentication** for all requests. Restrict to intended sign-in users/tenant.
2. Record each allowed person's Entra object/principal ID; set `APP_AUTH_MODE=azure` and comma-delimited `ALLOWED_PRINCIPAL_IDS` in App Service settings. Do not configure `DEV_AUTH_BYPASS` in production.
3. Set HTTPS-only, minimum TLS 1.2+, and restrict database network access.
4. Test that a non-signed-in browser, an unrelated signed-in user, and a direct API request are denied.
5. Test backup/restore and deployment rollback before recording real financial or property-sensitive data.

The app-side `x-ms-client-principal-id` guard assumes App Service Easy Auth has been correctly configured **at the edge**; do not rely on this header by itself as authentication outside App Service.

## Project management and code workflow
- ADO: https://dev.azure.com/nicholasrnoble/noble-property-management
- GitHub repository: create private `noble-property-management` and connect under ADO `Project settings > GitHub connections`.
- Example branch `feature/AB-<actual-work-item-id>-property-portfolio`.
- Commit subject `AB#123 Create property portfolio foundation` (replace `123` with the actual numeric Azure Boards ID after import).
- For CI: commit the generated `package-lock.json`, then configure Azure Pipelines from `azure-pipelines.yml`.

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

`npm run check` performs lint, type check, and tests. Production deployment is intentionally not configured yet.

## Database entities introduced
- `Property` — one record per property
- `MaintenanceTask` — work by property; UI is a future feature
- `FinancialTransaction` — income, expense, capital, principal, transfer; UI later
- `PropertyValuation` — value estimates over time; UI later
- `Mortgage` — financing information; UI later

## Next user stories
1. Connect private GitHub repo and Azure Boards.
2. Verify app locally and record CI checks.
3. Create Azure resource group, SQL server/database, and App Service identity.
4. Run migration and add the three properties.
5. Implement `MNT-001 Create maintenance task` with tests.

## Status / verification limitations
Scaffold source and the small Node unit tests were generated without access to npm package downloads in the authoring environment. You must run `npm install`, `npm run check`, and `npm run build` on your development machine/CI before treating it as deployed or production-ready.
