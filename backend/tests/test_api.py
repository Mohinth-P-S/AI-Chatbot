"""
Automated tests for FastAPI endpoints:
/api/health, /api/services, /api/helpline, /api/eligibility, /api/chat
"""
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "port" in data

def test_api_services():
    res = client.get("/api/services")
    assert res.status_code == 200
    data = res.json()
    assert "scholarships" in data
    assert "certificates" in data
    assert "pensions" in data
    assert len(data["scholarships"]) >= 15
    assert len(data["certificates"]) >= 5
    assert len(data["pensions"]) >= 4

def test_api_helpline():
    res = client.get("/api/helpline")
    assert res.status_code == 200
    data = res.json()
    assert "general_helpline" in data
    assert "scheme_helplines" in data
    assert "1100" in data["general_helpline"]["cm_helpline_tn"]

def test_api_eligibility_endpoint():
    payload = {
        "age": 19,
        "family_income": 100000,
        "category": "SC",
        "gender": "female",
        "education_level": "Undergraduate",
        "state": "Tamil Nadu",
        "is_disabled": False,
        "studied_in_govt_school": True
    }
    res = client.post("/api/eligibility", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "results" in data
    assert data["total_eligible"] > 0
    # Both SC post matric and Pudhumai Penn should be eligible
    el_ids = [s["scheme"]["id"] for s in data["results"]["eligible"]]
    assert "post-matric-sc-central" in el_ids
    assert "tn-pudhumai-penn" in el_ids

def test_api_chat_multilingual():
    # Test English
    res_en = client.post("/api/chat", json={
        "message": "What is the benefit of Pudhumai Penn scheme?",
        "language": "en",
        "profile": {}
    })
    assert res_en.status_code == 200
    data_en = res_en.json()
    assert "reply" in data_en
    assert len(data_en["sources"]) > 0

    # Test Tamil
    res_ta = client.post("/api/chat", json={
        "message": "புதுமைப் பெண் திட்டம் பற்றி சொல்லுங்கள்",
        "language": "ta",
        "profile": {}
    })
    assert res_ta.status_code == 200
    data_ta = res_ta.json()
    assert "reply" in data_ta
    assert len(data_ta["reply"]) > 0

    # Test Hindi
    res_hi = client.post("/api/chat", json={
        "message": "वृद्धावस्था पेंशन के लिए क्या नियम हैं?",
        "language": "hi",
        "profile": {}
    })
    assert res_hi.status_code == 200
    data_hi = res_hi.json()
    assert "reply" in data_hi
    assert len(data_hi["reply"]) > 0
