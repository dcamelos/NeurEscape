from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime, JSON
from sqlalchemy.sql import func
from app.database.db import Base


class LogEvent(Base):
    """
    Stores every drag & drop interaction event from the game.
    Two-layer schema based on Banihashem et al. (2023) GLA Framework:
      - Performance data: what the player answered
      - Process data: how, when, in what sequence they decided
    """
    __tablename__ = "log_events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── Session (anonymous, Lu et al. 2025 — stealth assessment) ──────────
    session_id = Column(String, index=True, nullable=False)
    level_id = Column(String, nullable=False)
    narrative_state = Column(String, nullable=True)  # which room/stage in the escape room

    # ── Performance data (Banihashem et al. 2023) ─────────────────────────
    event_type = Column(String, nullable=False)       # drag_drop_attempt | hint_request | level_complete
    symptom_id = Column(String, nullable=True)
    target_region = Column(String, nullable=True)
    correct_region = Column(String, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    attempt_number = Column(Integer, nullable=True)

    # ── Process data (Banihashem et al. 2023) ─────────────────────────────
    time_on_card_ms = Column(Integer, nullable=True)     # deliberation time
    previous_wrong_targets = Column(JSON, nullable=True) # array of strings
    hints_used = Column(Integer, default=0)
    hint_level = Column(Integer, nullable=True)          # 1=system, 2=function, 3=direct

    # ── Timestamp (client-side, for ordering) ─────────────────────────────
    client_timestamp = Column(String, nullable=True)
