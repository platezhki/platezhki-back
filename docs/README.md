# How to setup locally

1. make env file (copy .env.example to .env and change some environmental fields if needed)
2. run commands

## Commands

### Install node_modules
```bash
npm i
```

### Generate Prisma client
```bash
npm run db:generate
```

### Run docker compose
```bash
docker compose up -d
```

### Migrate Prisma schema to db
```bash
npm run db:migrate
```

### Seed data to db
```bash
npm run db:seed
```

### Regenerate docs Documentation
```bash
npm run docs:generate
```
Starts the development server with Swagger UI available at `/api-docs`.

### When all is ready run
```bash
npm run dev
```

All endpoints return JSON responses with `success`, `message`, and optional `data` fields.


