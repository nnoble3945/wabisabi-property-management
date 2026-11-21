# ADR-0001: Azure-hosted modular monolith

**Status:** Proposed for initial release (2026-11-21)

## Context
Three properties: one owner-occupied, one long-term rental, one mixed personal-use/short-term-rental cabin. The app must track maintenance, operating costs, income, valuations, and equity. The developer prefers Azure tooling and Azure DevOps.

## Decision
- Next.js App Router + React + TypeScript + Tailwind; server routes and SQL access in one deployable app.
- Azure App Service Linux, Node 24 LTS; app-level development in local machine.
- Azure SQL for relational source of truth; model all property types together but keep rental operations distinct.
- Azure App Service Microsoft Entra Easy Auth with **require authentication** at the edge; explicit per-user allowlist in app. Never expose the app without this configuration.
- Managed identity to Azure SQL in production; Azure CLI sign-in or restricted development SQL credentials locally.
- GitHub private repository, Azure Boards for work management, Azure Pipelines for CI/CD.
- Azure Blob Storage for documents and images in a later feature.

## Consequences
- Low conceptual overhead; flexible enough to support more properties.
- Azure SQL and App Service cost money even with very low traffic; review subscription pricing before provisioning.
- No multi-tenant auth, public listings, calendars, property manager integrations, notifications, or automatic valuation in the first increment.
- Financial transactions separate principal payments and capital spending from operating profit.
- Azure deployment is blocked until authentication, database identity, and access restrictions are verified.

## Deferred decisions
- Managed storage upload/download authorization, production backup retention, financial imports, automated estimate integrations, job scheduling, and multi-user permissions.
