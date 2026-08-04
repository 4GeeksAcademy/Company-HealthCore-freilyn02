import sys
from pathlib import Path

SCRIPTS_DIR = Path(__file__).resolve().parents[2] / "scripts"
sys.path.append(str(SCRIPTS_DIR))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.incidents import router as incidents_router

app = FastAPI(title="HealthCore Incident Analyzer API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(incidents_router, prefix="/api/incidents", tags=["incidents"])


@app.get("/")
def health_check():
    """Simple endpoint to confirm the API is running."""
    return {"status": "ok", "service": "incident-analyzer-api"}
