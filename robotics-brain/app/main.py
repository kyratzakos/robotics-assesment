import os
from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from app.supabase_client import get_client
from app.schemas import WebhookPayload
from app.processor import process_stack

app = FastAPI()

def verify_webhook(req: Request):
    secret = os.getenv("WEBHOOK_SECRET")
    if not secret:
        return True
    sig = req.headers.get("x-webhook-secret")
    return sig == secret

@app.post("/webhooks/task-stacks")
async def task_stacks_insert(payload: WebhookPayload, request: Request, background: BackgroundTasks):
    if not verify_webhook(request):
        raise HTTPException(status_code=401, detail="unauthorized")
    if payload.type not in ["INSERT", "insert", "created"]:
        return {"ok": True}
    rec = payload.record or {}
    ref = rec.get("id") or rec.get("stack_id")
    if not ref:
        raise HTTPException(status_code=400, detail="missing stack reference")
    client = get_client()
    background.add_task(process_stack, client, ref)
    return {"queued": ref}

@app.post("/process/{stackRef}")
async def manual_process(stackRef: str, background: BackgroundTasks):
    client = get_client()
    background.add_task(process_stack, client, stackRef)
    return {"queued": stackRef}

@app.get("/healthz")
async def healthz():
    return {"ok": True}
