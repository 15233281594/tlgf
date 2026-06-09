# tlgf-server

Express service for the `tlgf` Vue 3 application.

This version keeps the backend simple and clean while preserving a production-style structure: config, routes, controllers, middleware, and shared core utilities. Database, authentication, and permission modules can be added step by step later.

## Scripts

```bash
npm run dev
npm start
npm run check
npm run db:init
```

`npm run dev` uses `nodemon`, so the service restarts automatically after source file changes.

## Endpoints

- `GET /api/health` - service health status
- `GET /api/v1/users/me` - mocked current user

## Database

The service supports MySQL-compatible databases, including TiDB Cloud Starter.
Keep database credentials in environment variables on the backend host only. Do
not put them in the Vue frontend or commit them to GitHub.

Required variables:

```bash
DB_HOST=
DB_PORT=4000
DB_USER=
DB_PASSWORD=
DB_NAME=tlgf
DB_SSL=true
```

After filling the variables, initialize the first tables:

```bash
npm run db:init
```

## Structure

```text
src/
  app.js                Express app composition
  server.js             process entrypoint
  config/               environment and runtime config
  core/                 logger and shared errors
  db/                   MySQL/TiDB connection pool
  middleware/           Express middleware
  modules/              business modules
  routes/               API route registry
sql/                    schema initialization files
scripts/                maintenance commands
```
