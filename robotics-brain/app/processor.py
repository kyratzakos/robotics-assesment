import asyncio
from typing import Optional, Tuple
from supabase import Client

async def fetch_stack(client: Client, ref: str):
    q = client.table("task_stacks").select("*").eq("id", ref).single()
    r = q.execute()
    if r.data is None:
        q = client.table("task_stacks").select("*").eq("stack_id", ref).single()
        r = q.execute()
    return r.data

def set_status(client: Client, row_id: str, status: str):
    client.table("task_stacks").update({"status": status}).eq("id", row_id).execute()

async def process_stack(client: Client, ref: str):
    row = await fetch_stack(client, ref)
    if not row:
        print(f"stack not found: {ref}")
        return
    if row["status"] not in ["pending"]:
        print(f"skip stack {row['stack_id']} status={row['status']}")
        return
    set_status(client, row["id"], "in_progress")
    tasks = row["tasks"] or []
    for t in tasks:
        ttype = t.get("type")
        if ttype == "pick":
            src = t.get("from") or t.get("from_") or {}
            print(f"Sending command: pick from {src}")
        elif ttype == "place":
            dst = t.get("to") or {}
            print(f"Sending command: place to {dst}")
        else:
            print(f"Unknown task type: {ttype}")
            set_status(client, row["id"], "failed")
            return
        await asyncio.sleep(1)
    set_status(client, row["id"], "completed")
