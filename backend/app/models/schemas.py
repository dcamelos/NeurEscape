from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class LogEventCreate(BaseModel):
    """Schema for incoming log events from the frontend."""

    session_id: str
    level_id: str
    narrative_state: Optional[str] = None

    # Performance data
    event_type: str  # drag_drop_attempt | hint_request | level_complete
    symptom_id: Optional[str] = None
    target_region: Optional[str] = None
    correct_region: Optional[str] = None
    is_correct: Optional[bool] = None
    attempt_number: Optional[int] = None

    # Process data
    time_on_card_ms: Optional[int] = None
    previous_wrong_targets: Optional[List[str]] = Field(default_factory=list)
    hints_used: Optional[int] = 0
    hint_level: Optional[int] = None

    client_timestamp: Optional[str] = None


class LogEventResponse(LogEventCreate):
    """Schema for outgoing log event responses."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SessionExport(BaseModel):
    """Full session export for research analysis."""
    session_id: str
    level_id: str
    total_events: int
    events: List[LogEventResponse]
