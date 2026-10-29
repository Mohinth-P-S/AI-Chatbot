"""
Unit tests for the document scanner, ID masking, and /api/scan endpoint.
"""
import io
from fastapi.testclient import TestClient
from app.main import app
from app.scanner import mask_id_number, extract_document_data

client = TestClient(app)

def test_mask_id_number():
    # 12-digit ID (e.g. Aadhaar)
    assert mask_id_number("123456789012") == "XXXX-XXXX-9012"
    assert mask_id_number("1234 5678 9012") == "XXXX-XXXX-9012"
    assert mask_id_number("1234-5678-9012") == "XXXX-XXXX-9012"

    # Other ID lengths
    assert mask_id_number("TN12345678") == "XXXX-XXXX-5678"
    assert mask_id_number("4321") == "XXXX-4321"
    assert mask_id_number(None) is None
    assert mask_id_number("") is None

def test_scan_api_valid_image():
    # Create a tiny dummy 1x1 GIF/PNG in memory
    dummy_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    
    response = client.post(
        "/api/scan",
        files={"file": ("test_income.png", io.BytesIO(dummy_png), "image/png")},
        data={"document_type": "income_certificate"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "document_type" in data
    assert "extracted_fields" in data
    assert "masked_id" in data
    assert "XXXX" in data["masked_id"]
    assert "confidence_note" in data

def test_scan_api_invalid_mime():
    response = client.post(
        "/api/scan",
        files={"file": ("test.txt", io.BytesIO(b"Hello world"), "text/plain")},
        data={"document_type": "marksheet"}
    )
    assert response.status_code == 400
    assert "Unsupported file format" in response.json()["detail"]

def test_scan_api_too_large():
    # 5.1 MB dummy payload
    large_payload = b"0" * (5 * 1024 * 1024 + 100)
    response = client.post(
        "/api/scan",
        files={"file": ("large.png", io.BytesIO(large_payload), "image/png")},
        data={"document_type": "general"}
    )
    assert response.status_code == 413
    assert "limit" in response.json()["detail"].lower()
