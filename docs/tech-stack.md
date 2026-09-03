# Tech Stack

## Frontend
- **TECHNOLOGY**: Next.js (App Router)
- **PURPOSE**: Full-stack React framework.
- **WHY CHOSEN**: Fast server-side rendering, API route capability, standard for modern React.
- **ALTERNATIVES CONSIDERED**: Vite SPA (rejected due to SEO/routing complexity), Angular.
- **PHASE USED**: Phase 1+
- **FUTURE ROLE**: Primary presentation layer.

- **TECHNOLOGY**: Tailwind CSS v4 & shadcn/ui
- **PURPOSE**: UI component styling.
- **WHY CHOSEN**: Rapid, consistent, utility-first styling without bulky runtime CSS.

## Backend
- **TECHNOLOGY**: FastAPI
- **PURPOSE**: High-performance async Python API.
- **WHY CHOSEN**: Automatic OpenAPI validation, Pydantic integration, native async for high throughput.
- **ALTERNATIVES CONSIDERED**: Django (too heavy), Express/Node (lack of robust Python data-science ecosystem).

- **TECHNOLOGY**: SQLAlchemy 2.0 (Async) + Alembic
- **PURPOSE**: ORM and Database Migrations.
- **WHY CHOSEN**: Strict domain modeling, type-safe queries, proven enterprise track record.

## Database
- **TECHNOLOGY**: PostgreSQL + PostGIS
- **PURPOSE**: Primary relational data and spatial intelligence.
- **WHY CHOSEN**: ACID compliance, powerful geographic queries (`ST_Intersects`).
- **ALTERNATIVES CONSIDERED**: MongoDB (rejected, data is highly relational).

## Core Intelligence
- **TECHNOLOGY**: NetworkX
- **PURPOSE**: DAG construction and topological analysis.
- **WHY CHOSEN**: Standard library for graph math in Python; extremely fast for in-memory subset graphs.
- **ALTERNATIVES CONSIDERED**: Neo4j (rejected, too much overhead for a derived graph layer).

## Security (Abstractions)
- **TECHNOLOGY**: RBAC / Custom Authorizer / Rate Limiter
- **PURPOSE**: Defense in depth.
- **WHY CHOSEN**: Ensures security scales with the app and fails closed.
