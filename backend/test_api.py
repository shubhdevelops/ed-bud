import requests
import json
from pprint import pprint
import time
import uuid

BASE_URL = "http://127.0.0.1:5001"

# Wait for server to start
print("Waiting for server to start...")
time.sleep(2)  # Wait 2 seconds

def test_health():
    """Test health check endpoint"""
    print("\n=== Testing Health Check ===")
    response = requests.get(f"{BASE_URL}/health")
    print(response.json())
    return response.json()

def test_login(email, password):
    """Test login endpoint"""
    print(f"\n=== Testing Login for {email} ===")
    response = requests.post(
        f"{BASE_URL}/api/login",
        json={"email": email, "password": password}
    )
    print(response.json())
    return response.json()

def test_create_user(firstname, lastname, email, password, role="student"):
    """Test user creation endpoint"""
    print(f"\n=== Testing Create User for {email} ===")
    response = requests.post(
        f"{BASE_URL}/api/users",
        json={
            "firstname": firstname,
            "lastname": lastname,
            "email": email,
            "password": password,
            "role": role
        }
    )
    print(response.json())
    return response.json()

def test_create_metadata(url_path, transcript, notes):
    """Test metadata creation endpoint"""
    print(f"\n=== Testing Create Metadata for {url_path} ===")
    response = requests.post(
        f"{BASE_URL}/api/metadata",
        json={
            "url_path": url_path,
            "transcript": transcript,
            "notes": notes
        }
    )
    print(response.json())
    return response.json()

def test_add_chat_message(metadata_id, question, answer):
    """Test adding chat message endpoint"""
    print(f"\n=== Testing Add Chat Message for metadata {metadata_id} ===")
    response = requests.post(
        f"{BASE_URL}/api/metadata/{metadata_id}/chat",
        json={
            "question": question,
            "answer": answer
        }
    )
    print(response.json())
    return response.json()

def test_add_flashcard(metadata_id, question, answer):
    """Test adding flashcard endpoint"""
    print(f"\n=== Testing Add Flashcard for metadata {metadata_id} ===")
    response = requests.post(
        f"{BASE_URL}/api/metadata/{metadata_id}/flashcards",
        json={
            "question": question,
            "answer": answer
        }
    )
    print(response.json())
    return response.json()

def run_all_tests():
    """Run all API tests"""
    # Test health check
    test_health()
    
    # Create a new user with unique email
    unique_email = f"test_{uuid.uuid4()}@example.com"
    user_response = test_create_user(
        "Test",
        "User",
        unique_email,
        "password123",
        "student"
    )
    
    # Test login with the new user
    if "user" in user_response:
        test_login(unique_email, "password123")
    
    # Test create metadata
    metadata_response = test_create_metadata(
        "https://youtube.com/watch?v=test123",
        "Test transcript",
        "Test notes"
    )
    
    if "metadata" in metadata_response:
        metadata_id = metadata_response["metadata"]["_id"]
        
        # Test add chat message
        test_add_chat_message(
            metadata_id,
            "What is this video about?",
            "This is a test video"
        )
        
        # Test add flashcard
        test_add_flashcard(
            metadata_id,
            "What are we testing?",
            "We are testing the API endpoints"
        )

if __name__ == "__main__":
    run_all_tests() 