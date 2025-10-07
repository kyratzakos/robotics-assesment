# Robotics Brain

A FastAPI service that processes robotic task stacks from Supabase webhooks.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Configure environment variables:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
WEBHOOK_SECRET=optional_webhook_secret
```

## Development

```bash
uvicorn app.main:app --reload --port 8080
```

Server runs on [http://localhost:8080](http://localhost:8080)

## API Endpoints

- `POST /webhooks/task-stacks` - Webhook endpoint for new task stacks
- `POST /process/{stackRef}` - Manually trigger stack processing
- `GET /healthz` - Health check endpoint

## How It Works

1. Receives webhook when a new task stack is created in Supabase
2. Fetches the stack and validates its status
3. Processes each task in the stack (pick/place operations)
4. Updates stack status: `pending` → `in_progress` → `completed`
