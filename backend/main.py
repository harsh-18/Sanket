import os
import secrets
import time
from pathlib import Path
from typing import Dict, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

app = FastAPI(title="Sanket Nearby & AI Gateway", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Temporary in-memory Nearby sessions (ephemeral by design; no permanent history stored)
ROOMS: Dict[str, dict] = {}
CONNECTIONS: Dict[str, List[WebSocket]] = {}


class TranslateRequest(BaseModel):
    text: str
    source_lang: str = "hi"
    target_lang: str = "en"


@app.get("/health")
def health():
    bhashini_ready = bool(os.getenv("BHASHINI_USER_ID") and os.getenv("BHASHINI_API_KEY"))
    return {
        "status": "ok",
        "service": "sanket-backend",
        "bhashini_configured": bhashini_ready,
        "mode": "bhashini" if bhashini_ready else "zero_key_local_fallback",
    }


@app.post("/api/rooms")
def create_room():
    code = f"SANKET-{secrets.randbelow(90) + 10}"
    token = secrets.token_urlsafe(16)
    expires_at = int(time.time()) + 300
    ROOMS[code] = {"code": code, "token": token, "expires_at": expires_at, "accepted": False}
    return {"room_code": code, "token": token, "expires_at": expires_at}


@app.post("/api/rooms/{code}/accept")
def accept_room(code: str):
    code = code.upper().strip()
    if code not in ROOMS:
        ROOMS[code] = {"code": code, "token": secrets.token_urlsafe(12), "expires_at": int(time.time()) + 300, "accepted": True}
    else:
        ROOMS[code]["accepted"] = True
    return {"room_code": code, "status": "connected"}


@app.post("/api/bhashini/translate")
def bhashini_translate(req: TranslateRequest):
    user_id = os.getenv("BHASHINI_USER_ID")
    api_key = os.getenv("BHASHINI_API_KEY")
    if not user_id or not api_key:
        return JSONResponse(
            status_code=200,
            content={
                "status": "key_not_set",
                "message": "BHASHINI API key not set — using local browser/phrasebook fallback.",
                "translated_text": None,
            },
        )
    # Placeholder for authenticated ULCA pipeline compute call when keys are provisioned
    return {
        "status": "configured",
        "source_lang": req.source_lang,
        "target_lang": req.target_lang,
        "translated_text": req.text,
    }


@app.websocket("/ws/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str):
    await websocket.accept()
    CONNECTIONS.setdefault(room_code, []).append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            for peer in list(CONNECTIONS.get(room_code, [])):
                if peer is not websocket:
                    try:
                        await peer.send_text(data)
                    except Exception:
                        pass
    except WebSocketDisconnect:
        if room_code in CONNECTIONS and websocket in CONNECTIONS[room_code]:
            CONNECTIONS[room_code].remove(websocket)


# Serve static Web App from ../src when present
SRC_DIR = Path(__file__).resolve().parent.parent / "src"
if SRC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(SRC_DIR), html=True), name="web")
