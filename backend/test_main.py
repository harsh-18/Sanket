from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_starts_without_keys():
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "mode" in data


def test_room_create_and_accept():
    res = client.post("/api/rooms")
    assert res.status_code == 200
    code = res.json()["room_code"]
    assert code.startswith("SANKET-")

    acc = client.post(f"/api/rooms/{code}/accept")
    assert acc.status_code == 200
    assert acc.json()["status"] == "connected"


def test_bhashini_zero_key_fallback():
    res = client.post("/api/bhashini/translate", json={"text": "नमस्ते", "source_lang": "hi", "target_lang": "en"})
    assert res.status_code == 200
    assert res.json()["status"] == "key_not_set"


def test_websocket_nearby_relay():
    with client.websocket_connect("/ws/SANKET-99") as ws1:
        with client.websocket_connect("/ws/SANKET-99") as ws2:
            ws1.send_text('{"type":"msg","text":"Hello"}')
            received = ws2.receive_text()
            assert "Hello" in received
