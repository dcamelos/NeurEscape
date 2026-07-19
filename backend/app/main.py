from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.database.db import init_db
from app.routes import logs, levels

settings = get_settings()

app = FastAPI(
    title="NeurEscape API",
    description="Learning Analytics backend for NeurEscape — stealth assessment via GLA Framework (Banihashem et al., 2023)",
    version="1.0.0",
)

# CORS — allows frontend (Next.js) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(logs.router)
app.include_router(levels.router)


@app.on_event("startup")
def startup():
    """Initialize database tables on startup."""
    init_db()


@app.get("/")
def root():
    return {
        "project": "NeurEscape",
        "status": "running",
        "environment": settings.environment,
        "docs": "/docs",
    }


@app.get("/health")
def health():
    return {"status": "ok"}
