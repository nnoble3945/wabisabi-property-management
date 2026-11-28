# F02.1 — Property Records: Release 0.2

## Scope
A dedicated profile for each existing property, reusing `dbo.Property`.
No SQL migration or new Azure resources are required.

Implemented:
- Create property with category, address, optional acquisition date and purchase price.
- View a property detail page from the portfolio.
- Edit the property profile, with server validation and persistence in Azure SQL.
- Protected GET and PATCH API endpoints with the existing Entra/user-allowlist policy.
- Validation coverage for property types, required values, date, price and unknown fields.

Excluded from F02.1:
- Mortgage transactions/equity (F02.2).
- Current estimates and valuation history (F02.3).
- Maintenance or financial transactions.
- Ownership entity/tax classification (E08).
- Property deletion/archiving pending explicit acceptance criteria.

## Suggested ADO user stories
**US — View property details**: From the portfolio, open a selected property and see its address, type, acquisition date and purchase price. Missing optional data is labeled 'Not recorded'.

**US — Maintain property profile**: Create and edit a property from the UI; require a name, type and valid address; accept optional acquisition and purchase details; persist changes across refreshes.

**US — Secure property API**: A request without authorization cannot retrieve or modify property data. Invalid IDs and input return 400; missing records return 404.

## Manual acceptance tests after PR CI passes
1. On a local environment connected to the development database, open the existing cabin; confirm its profile displays and matches the SQL record.
2. Edit the cabin's display name or address; save, refresh, and confirm the change survives (restore original values if testing).
3. Create the primary residence and the long-term rental using actual records (do not hardcode private addresses in repository source).
4. Add an acquisition date and purchase price; verify formatted detail values after refresh.
5. Submit invalid purchase price/date and verify validation blocks saving.
6. Check `GET /api/properties/{id}` and `PATCH /api/properties/{id}` reject unauthorized users. Test invalid IDs and missing IDs.
7. Confirm prior cabin data remains intact. Review App Service logs for any new errors.
8. Merge only after automated CI passes; manually deploy after review.

## Security and recovery note
US06 remains Active. Avoid entering sensitive financial or tax information until its backup/audit baseline has been accepted.

## Transient Azure SQL connection hardening

- Database connection timeout: 30 seconds (previously 15).
- Up to 3 connection-establishment attempts; wait 2 seconds, then 5 seconds if transient failures persist.
- Retry is restricted to known temporary SQL/network errors. It **never** replays SQL statements, avoiding duplicate writes.
- Failed connection attempts are logged; permanent authentication, SQL firewall, and schema errors remain visible and do not trigger retries.
- After exhausted temporary connection failures, property pages display a neutral temporary-unavailable message and a manual **Retry database connection** action. APIs return HTTP 503 with Retry-After rather than a permanent-looking error.

### Focused local unit tests

Run on the checked-out feature branch:

```powershell
node --test tests/sql-resilience.test.mjs
npm run check
npm run build
```

Unit tests verify temporary failure classification, wrapped SQL error detection, bounded retries, eventual success, permanent error fast-fail, and no retry after a successful connection. These tests inject a failure and do **not** need a live Azure SQL connection.

### Manual smoke tests

1. Open localhost and verify the existing Welches Cabin appears once connected.
2. Open its property profile and confirm optional fields render correctly.
3. Change a harmless property display field, save, refresh, and verify persistence; restore original value if needed.
4. Confirm invalid property inputs are rejected without mutating records.
5. After SQL has been idle long enough to auto-pause, reload and observe whether it successfully reconnects; if needed, use the retry button. Do not intentionally turn off or alter firewall rules to simulate errors.
6. Review the VS Code console to ensure errors are logged when retries occur; a firewall/login rejection must remain an error rather than misleadingly appearing as a serverless wake-up.
7. Verify that an unauthorized session still cannot read or write properties.

**Note:** These are unit tests plus manual smoke tests, not an end-to-end simulated Azure SQL cold-start test. F01.3/US06 remains open.
