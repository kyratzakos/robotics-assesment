# Robotics Backend (Part 1)

A Next.js API for managing robotic devices and task stacks with Supabase authentication.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables (see `.env.example`)

3. Initialize the database with `supabase/schema.sql`

## Development

```bash
npm run dev
```

Server runs on [http://localhost:3000](http://localhost:3000)

## API Endpoints

- `GET /api/device/summary` - Get all devices, belonging to the authenticated user
- `POST /api/device/stack` - Create a new task stack for a device

All endpoints require Bearer token authentication.
