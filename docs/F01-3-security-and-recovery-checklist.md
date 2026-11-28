# F01.3 Security and Recovery Verification

**Status:** Pending Azure-side verification. Do not close US05 or US06 based only on passing code tests.

## US05 — Restrict access to approved users

Baseline:
- App Service: `app-wabisabi-pm-dev`, Azure region West US 2.
- App Service > Authentication: enabled; **Require authentication**, redirect unauthenticated users to Microsoft.
- App Service settings: `APP_AUTH_MODE=azure`, `ALLOWED_PRINCIPAL_IDS` containing only approved Entra user object IDs.
- No `DEV_AUTH_BYPASS`, `SQL_USER`, or `SQL_PASSWORD` in App Service settings.
- App Service system-assigned managed identity is used for Azure SQL authentication.
- Do not treat the presence of an `x-ms-client-principal-id` header as trustworthy outside App Service Easy Auth.

Test after deployment (record date, tester, results and evidence in ADO):
1. Incognito browser without a Microsoft session: the website redirects to Microsoft sign-in; portfolio data remains unavailable.
2. Approved account: sign in and view the existing Welches Cabin entry.
3. Unapproved account in the same tenant (if available): the app returns its private-access screen and never reveals portfolio data.
4. Unauthenticated request to `/api/properties`: expect rejection / redirect from App Service Easy Auth, not property JSON.
5. Unauthenticated request to `/api/health`: expect rejection / redirect from App Service Easy Auth.
6. Approved account can add and read property records, while unauthorized users cannot call write APIs.
7. Confirm HTTPS-only and current supported minimum TLS version in App Service settings; confirm SQL firewall has no broad "Allow Azure services" rule.
8. Review Azure deployment settings and access control. Store test evidence without authentication tokens or user identifiers.

**Caution:** The app's authorization helper is defense in depth. App Service authentication must remain enabled and *required*. App Service authentication configuration and the user allowlist are Azure-side settings, not asserted by unit tests.

## US06 — Backup, restore and auditing baseline

1. Review **Azure SQL Database > Backups / Restore** and document the exact backup retention, PITR availability and relevant tier limitations. Do not assume the free offer supports the same features as paid tiers.
2. Before relying on the app for important records, perform a **test restore to a separate database** if supported; verify schema, record counts and representative property values. Document timing, cost and cleanup of the temporary database.
3. Confirm Azure SQL audit settings, audit destination and retention. Choose retention with privacy/cost considerations; do not enable optional paid services without approval.
4. Keep `sql/001_init.sql` and future migrations versioned. Record how to roll back a deployment and verify the previous build, without assuming schema changes are reversible.
5. Review Azure App Service Free F1 backup limitations. Do not claim automated App Service backups exist unless configured and verified.
6. Record recovery owner, recovery time objective, recovery point objective, and where encrypted export/backup artifacts (if used) are stored.
7. Treat the production launch/financial records security gate as open until recovery evidence is recorded.

## Definition of done

- Authorization policy unit tests and existing CI/build pass.
- Azure unauthenticated/approved/unapproved access scenarios are evidenced.
- Production HTTPS and environment configuration are verified.
- Backup and restore capability and limitations are documented, with restore validation where available.
- F01.3 is closed only after acceptance criteria are actually met.
