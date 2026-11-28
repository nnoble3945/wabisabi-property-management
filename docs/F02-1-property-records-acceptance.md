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
