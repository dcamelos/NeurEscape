from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from typing import List
from app.database.db import get_db
from app.models.log_event import LogEvent
from app.models.schemas import LogEventCreate, LogEventResponse, SessionExport

router = APIRouter(prefix="/logs", tags=["logs"])


@router.post("/", response_model=LogEventResponse, status_code=201)
def create_log_event(event: LogEventCreate, db: Session = Depends(get_db)):
    """
    Receives a single interaction event from the game.
    Called asynchronously from logger.ts — does not block Phaser's main thread.
    Stealth assessment: the player never sees this call (Lu et al., 2025).
    """
    db_event = LogEvent(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


@router.get("/session/{session_id}", response_model=SessionExport)
def get_session_events(session_id: str, db: Session = Depends(get_db)):
    """
    Returns all events for a session — used by the ResultScene to build
    the uncertainty map shown to the player at the end of the level.
    """
    events = db.query(LogEvent).filter(LogEvent.session_id == session_id).all()
    if not events:
        raise HTTPException(status_code=404, detail="Session not found")

    return SessionExport(
        session_id=session_id,
        level_id=events[0].level_id,
        total_events=len(events),
        events=events,
    )


@router.get("/export/{session_id}")
def export_session_json(session_id: str, db: Session = Depends(get_db)):
    """
    Downloads the full session log as a JSON file for external analysis
    (Python/Excel/R). This is the research export endpoint.
    Schema follows the two-layer GLA structure (Banihashem et al., 2023).
    """
    events = db.query(LogEvent).filter(LogEvent.session_id == session_id).all()
    if not events:
        raise HTTPException(status_code=404, detail="Session not found")

    export_data = {
        "metadata": {
            "session_id": session_id,
            "level_id": events[0].level_id,
            "total_events": len(events),
            "export_note": "GLA two-layer schema — Banihashem et al. (2023)",
        },
        "performance_summary": {
            "total_attempts": sum(1 for e in events if e.event_type == "drag_drop_attempt"),
            "correct_placements": sum(1 for e in events if e.is_correct is True),
            "total_hints_used": sum(e.hints_used or 0 for e in events),
        },
        "events": [
            {
                "id": e.id,
                "session_id": e.session_id,
                "level_id": e.level_id,
                "event_type": e.event_type,
                "symptom_id": e.symptom_id,
                "target_region": e.target_region,
                "correct_region": e.correct_region,
                "is_correct": e.is_correct,
                "attempt_number": e.attempt_number,
                "time_on_card_ms": e.time_on_card_ms,
                "previous_wrong_targets": e.previous_wrong_targets,
                "hints_used": e.hints_used,
                "hint_level": e.hint_level,
                "narrative_state": e.narrative_state,
                "client_timestamp": e.client_timestamp,
                "server_timestamp": e.created_at.isoformat() if e.created_at else None,
            }
            for e in events
        ],
    }

    return JSONResponse(
        content=export_data,
        headers={"Content-Disposition": f"attachment; filename=session_{session_id}.json"},
    )


@router.get("/health")
def health():
    return {"status": "ok", "service": "neurescape-logs"}
