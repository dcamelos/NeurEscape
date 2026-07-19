import json
import os
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/levels", tags=["levels"])

# Levels are loaded from JSON config files — scalable via file system
# No DB needed for level content; DB is only for analytics logs
LEVELS_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "levels")


@router.get("/{level_id}")
def get_level(level_id: str):
    """
    Returns level configuration from JSON file.
    Scalable: add level_02.json, level_03.json without touching code.
    """
    level_path = os.path.join(LEVELS_DIR, f"{level_id}.json")

    if not os.path.exists(level_path):
        raise HTTPException(status_code=404, detail=f"Level '{level_id}' not found")

    with open(level_path, "r", encoding="utf-8") as f:
        return json.load(f)


@router.get("/")
def list_levels():
    """Lists all available level IDs."""
    if not os.path.exists(LEVELS_DIR):
        return {"levels": []}

    levels = [
        f.replace(".json", "")
        for f in os.listdir(LEVELS_DIR)
        if f.endswith(".json")
    ]
    return {"levels": sorted(levels)}


@router.get("/health")
def health():
    return {"status": "ok", "service": "neurescape-levels"}
