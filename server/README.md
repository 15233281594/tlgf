# tlgf-server

Express service for the `tlgf` Vue 3 application.

This version keeps the backend simple and clean while preserving a production-style structure: config, routes, controllers, middleware, and shared core utilities. Database, authentication, and permission modules can be added step by step later.

## Scripts

```bash
npm run dev
npm start
npm run check
```

`npm run dev` uses `nodemon`, so the service restarts automatically after source file changes.

## Endpoints

- `GET /api/health` - service health status
- `GET /api/v1/users/me` - mocked current user

## Structure

```text
src/
  app.js                Express app composition
  server.js             process entrypoint
  config/               environment and runtime config
  core/                 logger and shared errors
  middleware/           Express middleware
  modules/              business modules
  routes/               API route registry
```
