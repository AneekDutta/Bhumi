# Domain Model

## Core Principle
PostgreSQL stores **authoritative operational state**. Derived analytics (criticality, float, spatial blockages) are calculated dynamically and not stored as source-of-truth facts unless for caching/lineage.

## Authoritative Entities
- **Project / Corridor**: The target infrastructure alignment (LineString).
- **AdministrativeBoundaries**: State, District, Village lookups.
- **Parcel**: Cadastral unit with `MultiPolygon` geometry and ownership.
- **Owner / ParcelOwner**: Landholders and their share percentages.
- **AcquisitionCase**: The statutory workflow tracker for a parcel.
- **StatutoryRule**: Configurable rule engine for RFCTLARR 2013 and NH Act 1956.
- **AuditLog**: Immutable append-only record of all state transitions.

## Spatial Reference
All geometries are stored in **EPSG:4326** (WGS 84) to ensure standard GeoJSON compatibility.
