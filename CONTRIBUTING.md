# Contributing Guidelines

1. **Architecture First**: Do not introduce new technologies (e.g., Redis, Kafka, ML libraries) without explicit architectural approval.
2. **Domain Boundaries**: Maintain strict separation between Authoritative State (PostgreSQL) and Derived Analytics.
3. **Statutory Rules**: Never hardcode legal timelines. Add them to the `statutory_rules` table with citations.
4. **Testing**: All API endpoints and domain logic must be covered by `pytest`.
5. **Formatting**: Use `ruff` for Python and `prettier` for TypeScript.
