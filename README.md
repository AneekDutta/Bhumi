# SIH26016: Land Acquisition Intelligence Platform

Real-Time National Land Acquisition & Management System for End-to-End Digital Monitoring and Decision Support.

## Overview
This platform provides a comprehensive digital workflow for statutory land acquisition with an embedded decision intelligence layer. It tracks legal timelines, project dependencies, and spatial contiguity to predict project execution bottlenecks.

## Phase 1 Architecture
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui.
- **Backend**: FastAPI modular monolith, SQLAlchemy 2.0, Pydantic v2.
- **Database**: PostgreSQL with PostGIS extension.

## Setup Instructions
1. Run `docker compose up -d` in the `infra/` directory to start the PostGIS database.
2. Backend: `cd backend && pip install -r requirements.txt && alembic upgrade head`
3. Seed data: `python scripts/seed_data.py`
4. Frontend: `cd apps/web && npm install && npm run dev`
