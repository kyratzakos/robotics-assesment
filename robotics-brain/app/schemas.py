from pydantic import BaseModel
from typing import Any, Dict, Optional, List

class Coord(BaseModel):
    x: float
    y: float
    z: float

class TaskPick(BaseModel):
    type: str
    from_: Coord

    class Config:
        fields = {"from_": "from"}

class TaskPlace(BaseModel):
    type: str
    to: Coord

TaskLike = Dict[str, Any]

class TaskStackRow(BaseModel):
    id: str
    stack_id: str
    device_id: str
    status: str
    tasks: List[TaskLike]

class WebhookRecord(BaseModel):
    id: Optional[str] = None
    stack_id: Optional[str] = None

class WebhookPayload(BaseModel):
    type: str
    table: str
    record: Dict[str, Any]
