# Sports Nutrition E-Commerce

Full-stack e-commerce platform built with Django REST Framework (backend) and Next.js (frontend).

## Quick Start

### 1. Copy environment files

```bash
cp backend/.env.example backend/.env
```

### 2. Start all services

```bash
docker-compose up -d
```

This starts three services:
- **db** — PostgreSQL 16 on port 5432
- **backend** — Django on port 8000
- **frontend** — Next.js on port 3000

### 3. Run migrations

```bash
docker-compose run --rm backend python manage.py migrate
```

### 4. Verify

```bash
# Backend health check
curl localhost:8000/api/v1/health/
# Expected: {"status": "ok"}

# Frontend
open http://localhost:3000
```

## Development

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Project Structure

```
.
├── backend/          # Django REST Framework API
├── frontend/         # Next.js application
├── docker-compose.yml
└── .github/workflows/ci.yml
```
