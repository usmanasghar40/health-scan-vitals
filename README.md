# Health Scan Vitals (Local)

This project now runs fully locally with a Postgres database and a lightweight API server.

## Local setup

1) Start Postgres:

```
docker-compose up -d
```

2) Apply schema + seed data:

```
docker exec -i health-scan-postgres psql -U postgres -d health_scan < server/db/schema.sql
docker exec -i health-scan-postgres psql -U postgres -d health_scan < server/db/seed.sql
```

3) Install dependencies:

```
npm install
```

4) Run both the API server and frontend:

```
npm run dev:all
```

The frontend runs on `http://localhost:8080` and the API on `http://localhost:3001`.

Postgres is mapped to host port `5433` to avoid conflicts with any local Postgres.

## Demo credentials

- Patient: `patient@example.com` / `password123`
- Provider: `provider@example.com` / `password123`
