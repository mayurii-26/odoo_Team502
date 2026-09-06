import asyncio
import os
import sys
import requests
import socketio

# Ensure UTF-8 output on Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")


BASE_URL = "http://127.0.0.1:8000"

def test_rest_endpoints():
    print("\n--- 1. Testing REST Endpoints ---")
    
    # 1.1 Test Users list
    res = requests.get(f"{BASE_URL}/api/v1/chat/users")
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    users = res.json()
    print(f"✓ GET /api/v1/chat/users returned {len(users)} users.")
    assert len(users) >= 2, "Need at least 2 users for chat testing"
    u1, u2 = users[0], users[1]
    u1_id, u2_id = u1["id"], u2["id"]
    print(f"  User 1: ID {u1_id} ({u1['name']})")
    print(f"  User 2: ID {u2_id} ({u2['name']})")

    # 1.2 Test Upload Valid JPG Image
    jpg_content = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.' \",#\x1c\x1c(7),01444\x1f'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xbf\x00\xff\xd9"
    files = {"file": ("dealflow_quote.jpg", jpg_content, "image/jpeg")}
    res = requests.post(f"{BASE_URL}/api/v1/chat/upload", files=files)
    assert res.status_code == 200, f"Upload JPG failed: {res.text}"
    img_data = res.json()
    assert img_data["message_type"] == "image"
    assert "file_url" in img_data
    print(f"✓ Upload JPG success: {img_data['file_url']}")

    # Verify static file serving for image
    img_get = requests.get(f"{BASE_URL}{img_data['file_url']}")
    assert img_get.status_code == 200, f"Failed to fetch uploaded image: {img_get.status_code}"
    print(f"✓ Static serving of uploaded image verified (HTTP 200, {len(img_get.content)} bytes)")

    # 1.3 Test Upload Valid PDF
    pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000108 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n185\n%%EOF\n"
    files = {"file": ("enterprise_proposal.pdf", pdf_content, "application/pdf")}
    res = requests.post(f"{BASE_URL}/api/v1/chat/upload", files=files)
    assert res.status_code == 200, f"Upload PDF failed: {res.text}"
    pdf_data = res.json()
    assert pdf_data["message_type"] == "pdf"
    assert "file_url" in pdf_data
    print(f"✓ Upload PDF success: {pdf_data['file_url']}")

    # Verify static file serving for PDF
    pdf_get = requests.get(f"{BASE_URL}{pdf_data['file_url']}")
    assert pdf_get.status_code == 200, f"Failed to fetch uploaded PDF: {pdf_get.status_code}"
    print(f"✓ Static serving of uploaded PDF verified (HTTP 200, {len(pdf_get.content)} bytes)")

    # 1.4 Test Upload Invalid Extension (Security Validation)
    files = {"file": ("malicious_payload.exe", b"MZexecutabledata", "application/octet-stream")}
    res = requests.post(f"{BASE_URL}/api/v1/chat/upload", files=files)
    assert res.status_code == 400, f"Expected 400 rejection for .exe, got {res.status_code}"
    print("✓ Upload rejection for unauthorized file extension (.exe) verified (HTTP 400)")

    # 1.5 Send Message via REST fallback
    msg_payload = {
        "sender_id": u1_id,
        "receiver_id": u2_id,
        "content": "Hello via REST API test!",
        "message_type": "text"
    }
    res = requests.post(f"{BASE_URL}/api/v1/chat/messages", json=msg_payload)
    assert res.status_code == 200, f"Send message failed: {res.text}"
    rest_msg = res.json()
    print(f"✓ REST message send success (Message ID: {rest_msg['id']})")

    # 1.6 Fetch Messages History
    res = requests.get(f"{BASE_URL}/api/v1/chat/messages?user1_id={u1_id}&user2_id={u2_id}")
    assert res.status_code == 200, f"Fetch messages failed: {res.text}"
    messages = res.json()
    assert len(messages) >= 1, "Expected at least 1 message in history"
    print(f"✓ GET /api/v1/chat/messages returned {len(messages)} message(s) between User {u1_id} and User {u2_id}")

    # 1.7 Fetch Conversations
    res = requests.get(f"{BASE_URL}/api/v1/chat/conversations?user_id={u1_id}")
    assert res.status_code == 200, f"Fetch conversations failed: {res.text}"
    convs = res.json()
    assert len(convs) >= 1, "Expected at least 1 conversation"
    print(f"✓ GET /api/v1/chat/conversations returned {len(convs)} conversation(s)")

    # 1.8 Mark as Read
    res = requests.post(f"{BASE_URL}/api/v1/chat/read", json={"conversation_id": convs[0]["id"], "user_id": u2_id})
    assert res.status_code == 200, f"Mark read failed: {res.text}"
    print(f"✓ POST /api/v1/chat/read returned: {res.json()}")

    return u1_id, u2_id, img_data, pdf_data

async def test_socketio_realtime(u1_id, u2_id, img_data, pdf_data):
    print("\n--- 2. Testing Real-Time Socket.IO Communication ---")

    sio_client1 = socketio.AsyncClient()
    sio_client2 = socketio.AsyncClient()

    received_messages_c2 = []
    typing_events_c2 = []
    read_receipts_c1 = []

    @sio_client2.on("receive_message")
    async def on_c2_receive_message(data):
        print(f"  [Client 2 Event] Received message in real time: '{data.get('content')}' type={data.get('message_type')}")
        received_messages_c2.append(data)

    @sio_client2.on("user_typing")
    async def on_c2_typing(data):
        print(f"  [Client 2 Event] Typing indicator: user_id={data.get('user_id')} is_typing={data.get('is_typing')}")
        typing_events_c2.append(data)

    @sio_client1.on("messages_read")
    async def on_c1_read(data):
        print(f"  [Client 1 Event] Messages read receipt: read_by_user_id={data.get('read_by_user_id')}")
        read_receipts_c1.append(data)

    # Connect both clients to Socket.IO server
    await sio_client1.connect(BASE_URL, socketio_path="socket.io")
    await sio_client2.connect(BASE_URL, socketio_path="socket.io")
    print("✓ Both Socket.IO clients connected to server.")

    # Join user rooms
    await sio_client1.emit("join_user", {"user_id": u1_id})
    await sio_client2.emit("join_user", {"user_id": u2_id})
    await asyncio.sleep(0.5)
    print(f"✓ Joined rooms: user_{u1_id} and user_{u2_id}")

    # Test Typing Indicator
    await sio_client1.emit("typing", {"sender_id": u1_id, "receiver_id": u2_id})
    await asyncio.sleep(0.3)
    assert any(t.get("is_typing") is True for t in typing_events_c2), "Client 2 should receive typing event"
    print("✓ Real-time typing indicator delivered successfully.")

    await sio_client1.emit("stop_typing", {"sender_id": u1_id, "receiver_id": u2_id})
    await asyncio.sleep(0.3)
    assert any(t.get("is_typing") is False for t in typing_events_c2), "Client 2 should receive stop_typing event"
    print("✓ Real-time stop typing indicator delivered successfully.")

    # Test Real-Time Text Message
    await sio_client1.emit("send_message", {
        "sender_id": u1_id,
        "receiver_id": u2_id,
        "content": "Real-time socket text delivery test! 🚀",
        "message_type": "text"
    })
    await asyncio.sleep(2.0)
    assert len(received_messages_c2) >= 1, "Client 2 should have received text message"
    print("✓ Real-time text message sent and received over Socket.IO!")

    # Test Real-Time Image Message
    await sio_client1.emit("send_message", {
        "sender_id": u1_id,
        "receiver_id": u2_id,
        "content": "Check out this screenshot",
        "message_type": "image",
        "file_url": img_data["file_url"],
        "file_name": img_data["file_name"],
        "file_size": img_data["file_size"],
        "mime_type": img_data["mime_type"]
    })
    await asyncio.sleep(2.0)
    assert any(m.get("message_type") == "image" for m in received_messages_c2), "Client 2 should receive image message"
    print("✓ Real-time image message delivered with full metadata over Socket.IO!")

    # Test Real-Time PDF Message
    await sio_client1.emit("send_message", {
        "sender_id": u1_id,
        "receiver_id": u2_id,
        "content": "Proposal Document Attached",
        "message_type": "pdf",
        "file_url": pdf_data["file_url"],
        "file_name": pdf_data["file_name"],
        "file_size": pdf_data["file_size"],
        "mime_type": pdf_data["mime_type"]
    })
    await asyncio.sleep(2.0)
    assert any(m.get("message_type") == "pdf" for m in received_messages_c2), "Client 2 should receive PDF message"
    print("✓ Real-time PDF document delivered with full metadata over Socket.IO!")

    # Test Mark Read Notification via Socket
    conv_id = received_messages_c2[0].get("conversation_id", 1)
    await sio_client2.emit("mark_read", {
        "conversation_id": conv_id,
        "user_id": u2_id
    })
    await asyncio.sleep(1.0)
    assert len(read_receipts_c1) >= 1, "Client 1 should have received read receipt"
    print("✓ Real-time read receipt (double-tick update) delivered to sender!")

    await sio_client1.disconnect()
    await sio_client2.disconnect()
    print("✓ Socket.IO clients disconnected cleanly.")

if __name__ == "__main__":
    u1_id, u2_id, img_data, pdf_data = test_rest_endpoints()
    asyncio.run(test_socketio_realtime(u1_id, u2_id, img_data, pdf_data))
    print("\n==========================================")
    print("ALL REAL-TIME CHAT TESTS PASSED PERFECTLY! 🎯")
    print("==========================================")
