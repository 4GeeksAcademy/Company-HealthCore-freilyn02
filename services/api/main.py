import sys
from pathlib import Path

# Add the repo's scripts/ folder to Python's import path, so this API
# can reuse the exact same validation logic as scripts/analyze.py
# instead of duplicating it.
SCRIPTS_DIR = Path(__file__).resolve().parents[2] / "scripts"
sys.path.append(str(SCRIPTS_DIR))

from fastapi import FastAPI

from routers.incidents import router as incidents_router

app = FastAPI(title="HealthCore Incident Analyzer API")

app.include_router(incidents_router, prefix="/api/incidents", tags=["incidents"])


@app.get("/")
def health_check():
    """Simple endpoint to confirm the API is running."""
    return {"status": "ok", "service": "incident-analyzer-api"}
