from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import logging
from dotenv import load_dotenv
load_dotenv()  # Must be called before imports that use env vars

from google_speech import transcribe_audio
from video_to_audio import convert_video_to_audio
from gemini_integration import generate_notes, generate_flashcards, generate_mindmap, generate_quiz
from chat_integration import chat_with_context, clear_conversation
import threading
import uuid
# latest comment1 

from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from datetime import datetime, timezone
from bson import ObjectId
from bson.json_util import dumps
import json
import hashlib
from youtube_processor import process_youtube_video
import re
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs
from PyPDF2 import PdfReader
from pymongo import MongoClient
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
# allow all origins
CORS(app, resources={r"/*": {"origins": "*"}})

# Define Upload & Output Folders
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "outputs"
CACHE_FOLDER = "cache"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)
os.makedirs(CACHE_FOLDER, exist_ok=True)

# Set the default port
PORT = int(os.environ.get("PORT", 5001))

# Get GCS bucket name from environment variable
GCS_BUCKET_NAME = os.environ.get("GCS_BUCKET_NAME", "your-bucket-name")

# Store processing status and results
processing_tasks = {}

# app/__init__.py
# load_dotenv() -- moved to top of file before imports


# app.config["MONGO_URI"] = os.environ.get("MONGO_URI", "MONGO_URI")
# replaced with 
mongo_uri = os.environ.get("MONGO_URI")

print("DEBUG MONGO_URI =", mongo_uri)  # keep this for now

if not mongo_uri:
    raise ValueError("❌ MONGO_URI not found. Check your .env file")

app.config["MONGO_URI"] = mongo_uri

# latest comment 1

# app.config["MONGO_URI"] = "mongodb://localhost:27017/your_db_name"
mongo = PyMongo(app)

# Create indexes for email uniqueness

# latest comment 1
# with app.app_context():
#     try:
#         mongo.db.users.create_index("email", unique=True)
#         print("MongoDB connected successfully")
#     except Exception as e:
#         print(f"Error connecting to MongoDB: {str(e)}")

with app.app_context():
    try:
        mongo.db.command("ping")  # real connection test
        mongo.db.users.create_index("email", unique=True)
        print("✅ MongoDB connected successfully")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {str(e)}")

bcrypt = Bcrypt(app)

# app/models.py
class User:
    @staticmethod
    def create_user(firstname, lastname, email, password, role="student", profilepic="default-profile.png"):
        if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            raise ValueError("Invalid email format")
        
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters long")
        
        # Check if email already exists
        if mongo.db.users.find_one({"email": email}):
            raise ValueError("Email already exists")
        
        user = {
            "firstname": firstname,
            "lastname": lastname,
            "email": email.lower(),
            "password": bcrypt.generate_password_hash(password).decode('utf-8'),
            "profilepic": profilepic,
            "role": role if role in ["student", "professor"] else "student",
            "timestamp": datetime.now(timezone.utc),
            "history": []
        }
        
        result = mongo.db.users.insert_one(user)
        user["_id"] = result.inserted_id
        return user

    @staticmethod
    def get_user_by_email(email):
        return mongo.db.users.find_one({"email": email.lower()})

    @staticmethod
    def verify_password(stored_password_hash, provided_password):
        return bcrypt.check_password_hash(stored_password_hash, provided_password)

# MongoDB operators
PUSH = "$push"

class Metadata:
    @staticmethod
    def create_metadata(url_path, transcript="", notes=""):
        metadata = {
            "url_path": url_path,
            "transcript": transcript,
            "notes": notes,
            "chatJSON": [],
            "flashcardsJSON": []
        }
        
        result = mongo.db.metadata.insert_one(metadata)
        metadata["_id"] = result.inserted_id
        return metadata

    @staticmethod
    def add_chat_message(metadata_id, question, answer):
        chat_entry = {
            "question": question,
            "answer": answer,
            "timestamp": datetime.now(timezone.utc)
        }
        
        mongo.db.metadata.update_one(
            {"_id": ObjectId(metadata_id)},
            {PUSH: {"chatJSON": chat_entry}}
        )

    @staticmethod
    def add_flashcard(metadata_id, question, answer):
        flashcard = {
            "question": question,
            "answer": answer,
            "lastReviewed": datetime.now(timezone.utc)
        }
        
        mongo.db.metadata.update_one(
            {"_id": ObjectId(metadata_id)},
            {PUSH: {"flashcardsJSON": flashcard}}
        )

class History:
    @staticmethod
    def create_history(user_id, metadata_id):
        history = {
            "user": ObjectId(user_id),
            "metadata": ObjectId(metadata_id),
            "timestamp": datetime.now(timezone.utc)
        }
        
        result = mongo.db.history.insert_one(history)
        
        # Add history reference to user
        mongo.db.users.update_one(
            {"_id": ObjectId(user_id)},
            {PUSH: {"history": result.inserted_id}}
        )
        
        return history


def get_video_hash(video_name):
    """Generate a hash for the video name to use as a cache key"""
    return hashlib.md5(video_name.encode()).hexdigest()

def get_cached_results(video_name):
    """Check if results for this video are already cached"""
    video_hash = get_video_hash(video_name)
    cache_file = os.path.join(CACHE_FOLDER, f"{video_hash}.json")
    
    if os.path.exists(cache_file):
        try:
            with open(cache_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading cache file: {str(e)}")
    
    return None

def save_to_cache(video_name, results):
    """Save results to cache for future use"""
    video_hash = get_video_hash(video_name)
    cache_file = os.path.join(CACHE_FOLDER, f"{video_hash}.json")
    
    try:
        with open(cache_file, 'w') as f:
            json.dump(results, f)
    except Exception as e:
        logger.error(f"Error saving to cache: {str(e)}")

def save_to_history(task_id, file_info, results):
    try:
        logger.info(f"Attempting to save history for task_id: {task_id}")
        
        history_doc = {
            'task_id': task_id,
            'timestamp': datetime.utcnow(),
            'file_info': file_info,
            'results': results
        }
        
        result = mongo.db.processing_history.insert_one(history_doc)
        logger.info(f"Successfully saved to history with id: {result.inserted_id}")
    except Exception as e:
        logger.error(f"Error saving to history: {e}")

def _truncate_text(text, max_chars=5000):
    """Truncate text to ~1000 words to speed up LLM processing."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars] + "\n\n[... transcript truncated for processing ...]"

def process_video(task_id, video_path, audio_output):
    """Process video in background thread"""
    try:
        # Extract video name from the path
        video_name = os.path.basename(video_path).split('_', 1)[1] if '_' in os.path.basename(video_path) else os.path.basename(video_path)
        
        processing_tasks[task_id]["status"] = "converting"
        # Convert video to audio
        convert_video_to_audio(video_path, audio_output)
        
        processing_tasks[task_id]["status"] = "transcribing"
        # Transcribe audio
        transcript = transcribe_audio(audio_output, bucket_name=GCS_BUCKET_NAME)
        
        if not transcript["text"]:
            processing_tasks[task_id]["status"] = "error"
            processing_tasks[task_id]["error"] = "Transcription failed"
            return
        
        # Generate title
        title = audio_output.split('/')[-1].split('.')[0]
        
        processing_tasks[task_id]["status"] = "generating_notes"
        # Single combined call: summary + notes in one LLM request
        truncated = _truncate_text(transcript["text"])
        combined = generate_notes(f'Generate a concise SUMMARY followed by detailed NOTES from this transcript:\n{truncated}')
        summary = combined
        notes = combined
            
        # Store results without generating flashcards
        results = {
            "transcript": transcript,
            "summary": summary,
            "notes": notes,
            "flashcards": []  # Initialize with empty flashcards array
        }
        
        # Save results to cache
        save_to_cache(video_name, results)
        
        # Save to history with file info
        file_info = {
            'type': 'video',
            'filename': os.path.basename(video_path),
            'source': 'upload'
        }
        save_to_history(task_id, file_info, results)
        
        processing_tasks[task_id]["status"] = "completed"
        processing_tasks[task_id]["results"] = results
        
        # Clean up temporary files
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(audio_output):
            os.remove(audio_output)
            
    except Exception as e:
        logger.error(f"Error during processing: {str(e)}", exc_info=True)
        processing_tasks[task_id]["status"] = "error"
        processing_tasks[task_id]["error"] = str(e)
        # Clean up temporary files in case of error
        if os.path.exists(video_path):
            os.remove(video_path)
        if os.path.exists(audio_output):
            os.remove(audio_output)

def get_video_id(url):
    """Extract video ID from YouTube URL."""
    try:
        # Handle different YouTube URL formats
        parsed_url = urlparse(url)
        if parsed_url.hostname in ('youtu.be', 'www.youtu.be'):
            return parsed_url.path[1:]
        if parsed_url.hostname in ('youtube.com', 'www.youtube.com'):
            if parsed_url.path == '/watch':
                return parse_qs(parsed_url.query)['v'][0]
            if parsed_url.path[:7] == '/embed/':
                return parsed_url.path.split('/')[2]
        return None
    except Exception as e:
        logger.error(f"Error extracting video ID: {str(e)}")
        return None

def process_youtube_video(task_id, url):
    """Process YouTube video in background thread"""
    try:
        processing_tasks[task_id]["status"] = "uploaded"

        # Get video ID from URL
        video_id = get_video_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL")

        # Get transcript from YouTube
        processing_tasks[task_id]["status"] = "transcribing"
        ytt_api = YouTubeTranscriptApi()
        
        # Try fetching transcript - first try English, then fall back to any available language
        try:
            transcript_result = ytt_api.fetch(video_id, languages=['en'])
        except Exception:
            # If English not available, list available transcripts and pick the first one
            transcript_list = ytt_api.list(video_id)
            available = list(transcript_list)
            if not available:
                raise ValueError("No transcripts available for this video")
            transcript_result = available[0].fetch()
        
        # Combine transcript segments into a single text
        transcript_text = " ".join([snippet.text for snippet in transcript_result.snippets])
        
        # Single combined call: summary + notes in one LLM request (2x faster)
        processing_tasks[task_id]["status"] = "generating_notes"
        truncated = _truncate_text(transcript_text)
        combined = generate_notes(f'Generate a concise SUMMARY followed by detailed NOTES from this transcript:\n{truncated}')
        summary = combined
        notes = combined
        
        # Update task status and results
        processing_tasks[task_id].update({
            "status": "completed",
            "results": {
                "transcript": {
                    "text": transcript_text,
                    "confidence": 1.0  # YouTube transcripts are pre-generated
                },
                "summary": summary,
                "notes": notes,
                "flashcards": []  # Initialize with empty flashcards array
            }
        })
        
        # Cache the results
        save_to_cache(url, processing_tasks[task_id]["results"])
        
        # Save to history with file info
        file_info = {
            'type': 'youtube',
            'url': url,
            'source': 'youtube'
        }
        save_to_history(task_id, file_info, processing_tasks[task_id]["results"])
        
    except Exception as e:
        logger.error(f"Error during YouTube processing: {str(e)}", exc_info=True)
        processing_tasks[task_id]["status"] = "error"
        processing_tasks[task_id]["error"] = str(e)

def process_pdf(task_id, pdf_path):
    """Process PDF in background thread"""
    try:
        # Extract PDF name from the path
        pdf_name = os.path.basename(pdf_path).split('_', 1)[1] if '_' in os.path.basename(pdf_path) else os.path.basename(pdf_path)
        
        processing_tasks[task_id]["status"] = "extracting"
        # Extract text from PDF
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        if not text.strip():
            processing_tasks[task_id]["status"] = "error"
            processing_tasks[task_id]["error"] = "No text could be extracted from PDF"
            return
        
        # Single combined call: summary + notes in one LLM request (2x faster)
        processing_tasks[task_id]["status"] = "generating_notes"
        truncated = _truncate_text(text)
        combined = generate_notes(f'Generate a concise SUMMARY followed by detailed NOTES from this transcript:\n{truncated}')
        summary = combined
        notes = combined
            
        # Store results without generating flashcards
        results = {
            "transcript": {
                "text": text,
                "confidence": 1.0  # PDF text extraction is deterministic
            },
            "summary": summary,
            "notes": notes,
            "flashcards": []  # Initialize with empty flashcards array
        }
        
        # Save results to cache
        save_to_cache(pdf_name, results)
        
        # Save to history with file info
        file_info = {
            'type': 'pdf',
            'filename': os.path.basename(pdf_path),
            'source': 'upload'
        }
        save_to_history(task_id, file_info, results)
        
        processing_tasks[task_id]["status"] = "completed"
        processing_tasks[task_id]["results"] = results
        
        # Clean up temporary files
        if os.path.exists(pdf_path):
            os.remove(pdf_path)
            
    except Exception as e:
        logger.error(f"Error during processing: {str(e)}", exc_info=True)
        processing_tasks[task_id]["status"] = "error"
        processing_tasks[task_id]["error"] = str(e)
        # Clean up temporary files in case of error
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


# routes 
@app.route("/")
def home():
    return "Backend is running 🚀"


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint to verify server status."""
    try:
        # Test MongoDB connection
        mongo.db.command("ping")
        return jsonify({"status": "running", "database": "connected"}), 200
    except Exception as e:
        logger.error(f"Health check error: {str(e)}", exc_info=True)
        return jsonify({
            "status": "running",
            "database": "disconnected",
            "error": str(e)
        }), 500

@app.route("/upload", methods=["POST"])
def upload_video():
    """Handles video upload and initiates processing."""
    try:
        if "video" not in request.files:
            logger.error("No video file in request")
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["video"]
        if file.filename == "":
            logger.error("Empty filename received")
            return jsonify({"error": "No file selected"}), 400

        # Generate unique task ID
        task_id = str(uuid.uuid4())
        
        # Check if this video is already in the cache
        cached_results = get_cached_results(file.filename)
        if cached_results:
            # Initialize task status with cached results
            processing_tasks[task_id] = {
                "status": "completed",
                "filename": file.filename,
                "results": cached_results,
                "cached": True
            }
            
            return jsonify({
                "message": "File found in cache",
                "task_id": task_id,
                "status": "completed",
                "cached": True
            }), 200

        video_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_{file.filename}")
        audio_output = os.path.join(OUTPUT_FOLDER, f"{task_id}_{os.path.splitext(file.filename)[0]}.mp3")

        # Save video file
        file.save(video_path)
        
        # Initialize task status
        processing_tasks[task_id] = {
            "status": "uploaded",
            "filename": file.filename
        }
        
        # Start processing in background thread
        thread = threading.Thread(
            target=process_video,
            args=(task_id, video_path, audio_output)
        )
        thread.start()
        
        return jsonify({
            "message": "File uploaded successfully",
            "task_id": task_id,
            "status": "uploaded"
        }), 200

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route("/upload-pdf", methods=["POST"])
def upload_pdf():
    """Handles PDF upload and initiates processing."""
    try:
        if "pdf" not in request.files:
            logger.error("No PDF file in request")
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["pdf"]
        if file.filename == "":
            logger.error("Empty filename received")
            return jsonify({"error": "No file selected"}), 400
            
        if not file.filename.lower().endswith('.pdf'):
            logger.error("Invalid file type")
            return jsonify({"error": "Please upload a PDF file"}), 400

        # Generate unique task ID
        task_id = str(uuid.uuid4())
        
        # Check if this PDF is already in the cache
        cached_results = get_cached_results(file.filename)
        if cached_results:
            # Initialize task status with cached results
            processing_tasks[task_id] = {
                "status": "completed",
                "filename": file.filename,
                "results": cached_results,
                "cached": True
            }
            
            return jsonify({
                "message": "File found in cache",
                "task_id": task_id,
                "status": "completed",
                "cached": True
            }), 200

        pdf_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_{file.filename}")

        # Save PDF file
        file.save(pdf_path)
        
        # Initialize task status
        processing_tasks[task_id] = {
            "status": "uploaded",
            "filename": file.filename
        }
        
        # Start processing in background thread
        thread = threading.Thread(
            target=process_pdf,
            args=(task_id, pdf_path)
        )
        thread.start()
        
        return jsonify({
            "message": "File uploaded successfully",
            "task_id": task_id,
            "status": "uploaded"
        }), 200

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route("/status/<task_id>", methods=["GET"])
def get_status(task_id):
    """Get the status and results of a processing task."""
    if task_id not in processing_tasks:
        logger.error(f"Task not found: {task_id}")
        return jsonify({"error": "Task not found"}), 404
        
    task = processing_tasks[task_id]
    
    response = {
        "status": task["status"]
    }
    
    # Handle both file uploads and YouTube URLs
    if "filename" in task:
        response["filename"] = task["filename"]
    elif "url" in task:
        response["url"] = task["url"]
    
    # Add cache information if available
    if "cached" in task:
        response["cached"] = task["cached"]
    
    if task["status"] == "completed":
        if "results" not in task:
            logger.error("Task marked as completed but no results found")
            response["error"] = "Results not found for completed task"
        else:
            response["results"] = task["results"]
    elif task["status"] == "error":
        logger.error(f"Task error: {task.get('error', 'Unknown error')}")
        response["error"] = task["error"]
    
    return jsonify(response), 200

@app.route("/debug/tasks", methods=["GET"])
def debug_tasks():
    """Debug endpoint to check the current state of processing tasks."""
    # Create a simplified version of the tasks for debugging
    debug_tasks = {}
    for task_id, task in processing_tasks.items():
        debug_tasks[task_id] = {
            "status": task["status"],
            "filename": task.get("filename", "unknown"),
            "has_results": "results" in task,
            "results_keys": list(task.get("results", {}).keys()) if "results" in task else [],
            "flashcards_count": len(task.get("results", {}).get("flashcards", [])) if "results" in task and "flashcards" in task["results"] else 0,
            "cached": task.get("cached", False)
        }
    
    return jsonify(debug_tasks), 200

@app.route("/generate_flashcards/<task_id>", methods=["POST"])
def generate_flashcards_endpoint(task_id):
    """Generate flashcards for a specific task on demand."""
    if task_id not in processing_tasks:
        logger.error(f"Task not found: {task_id}")
        return jsonify({"error": "Task not found"}), 404
    
    task = processing_tasks[task_id]
    
    # Check if the task is completed
    if task["status"] != "completed":
        logger.error(f"Cannot generate flashcards for task in status: {task['status']}")
        return jsonify({"error": f"Cannot generate flashcards for task in status: {task['status']}"}), 400
    
    # Check if we have the transcript
    if "results" not in task or "transcript" not in task["results"]:
        logger.error(f"No transcript found for task: {task_id}")
        return jsonify({"error": "No transcript found for this task"}), 400
    
    try:
        # Get the transcript text
        transcript_text = task["results"]["transcript"]["text"]
        
        # Generate flashcards
        flashcards = generate_flashcards(transcript_text)
        
        # Update the task results with the new flashcards
        if "results" in task:
            task["results"]["flashcards"] = flashcards
            
            # If this was a cached result, update the cache file
            if task.get("cached", False):
                video_name = task["filename"]
                save_to_cache(video_name, task["results"])
        
        return jsonify({
            "status": "success",
            "flashcards": flashcards
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating flashcards: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error generating flashcards: {str(e)}"}), 500

@app.route("/generate_mindmap/<task_id>", methods=["POST"])
def generate_mindmap_endpoint(task_id):
    """Generate a mind map for a specific task on demand."""
    if task_id not in processing_tasks:
        logger.error(f"Task not found: {task_id}")
        return jsonify({"error": "Task not found"}), 404
    
    task = processing_tasks[task_id]
    
    # Check if the task is completed
    if task["status"] != "completed":
        logger.error(f"Cannot generate mind map for task in status: {task['status']}")
        return jsonify({"error": f"Cannot generate mind map for task in status: {task['status']}"}), 400
    
    # Check if we have the transcript
    if "results" not in task or "transcript" not in task["results"]:
        logger.error(f"No transcript found for task: {task_id}")
        return jsonify({"error": "No transcript found for this task"}), 400
    
    try:
        # Get the transcript text
        transcript_text = task["results"]["transcript"]["text"]
        
        # Generate mind map
        mindmap = generate_mindmap(transcript_text)
        
        # Update the task results with the new mind map
        if "results" in task:
            task["results"]["mindmap"] = mindmap
            
            # If this was a cached result, update the cache file
            if task.get("cached", False):
                video_name = task["filename"]
                save_to_cache(video_name, task["results"])
        
        return jsonify({
            "status": "success",
            "mindmap": mindmap
        }), 200
        
    except Exception as e:
        logger.error(f"Error generating mind map: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error generating mind map: {str(e)}"}), 500

@app.route("/generate_quiz/<task_id>", methods=["POST"])
def generate_quiz_endpoint(task_id):
    """
    Generate quiz questions based on the transcript.
    """
    try:
        # Check if task exists
        if task_id not in processing_tasks:
            return jsonify({"error": "Task not found"}), 404
        
        # Check if task is completed
        if processing_tasks[task_id]["status"] != "completed":
            return jsonify({"error": "Task not completed yet"}), 400
        
        # Get the transcript
        transcript = processing_tasks[task_id]["results"].get("transcript", {}).get("text", "")
        
        if not transcript:
            return jsonify({"error": "No transcript available"}), 400
        
        # Generate quiz questions
        quiz_questions = generate_quiz(transcript)
        
        # Update the task results
        processing_tasks[task_id]["results"]["quiz"] = quiz_questions
        
        return jsonify({
            "status": "success",
            "quiz": quiz_questions
        })
        
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/users", methods=["POST"])
def create_user():
    try:
        data = request.get_json()
        logger.info(f"Registration attempt for email: {data.get('email', 'not provided')}")
        
        if not data:
            logger.error("No data provided in registration request")
            return jsonify({"error": "No data provided"}), 400
            
        required_fields = ["firstname", "lastname", "email", "password"]
        for field in required_fields:
            if field not in data:
                logger.error(f"Missing required field: {field}")
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        user = User.create_user(
            firstname=data["firstname"],
            lastname=data["lastname"],
            email=data["email"],
            password=data["password"],
            role=data.get("role", "student")
        )
        # Remove password from response
        user.pop("password", None)
        logger.info("User created successfully")
        return jsonify({"message": "User created successfully", "user": dumps(user)}), 201
    except ValueError as e:
        logger.error(f"Validation error during registration: {str(e)}")
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        logger.error(f"Unexpected error during registration: {str(e)}", exc_info=True)
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500

@app.route("/api/login", methods=["POST"])
def login():
    try:
        data = request.get_json()
        logger.info(f"Login attempt for email: {data.get('email', 'not provided')}")
        
        if not data or "email" not in data or "password" not in data:
            logger.error("Missing email or password in login request")
            return jsonify({"error": "Email and password are required"}), 400
            
        user = User.get_user_by_email(data["email"])
        
        if not user:
            logger.info("User not found")
            return jsonify({"error": "Invalid email or password"}), 401
            
        if not User.verify_password(user["password"], data["password"]):
            logger.info("Invalid password")
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Remove password from response and serialize ObjectId
        user.pop("password", None)
        # Convert ObjectId to string
        user["_id"] = str(user["_id"])
        # Convert history ObjectIds to strings
        user["history"] = [str(h) for h in user["history"]]
        
        logger.info("Login successful")
        return jsonify({
            "message": "Login successful",
            "user": user
        }), 200
    except Exception as e:
        logger.error(f"Login error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/metadata", methods=["POST"])
def create_metadata():
    try:
        data = request.get_json()
        metadata = Metadata.create_metadata(
            url_path=data["url_path"],
            transcript=data.get("transcript", ""),
            notes=data.get("notes", "")
        )
        # Convert ObjectId to string
        metadata["_id"] = str(metadata["_id"])
        return jsonify({
            "message": "Metadata created successfully",
            "metadata": metadata
        }), 201
    except Exception as e:
        logger.error(f"Metadata creation error: {str(e)}", exc_info=True)
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/history", methods=["POST"])
def create_history():
    try:
        data = request.get_json()
        history = History.create_history(
            user_id=data["user_id"],
            metadata_id=data["metadata_id"]
        )
        return jsonify({"message": "History created successfully", "history": dumps(history)}), 201
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

# Example usage of adding chat messages and flashcards
@app.route("/api/metadata/<metadata_id>/chat", methods=["POST"])
def add_chat_message(metadata_id):
    try:
        data = request.get_json()
        Metadata.add_chat_message(
            metadata_id=metadata_id,
            question=data["question"],
            answer=data["answer"]
        )
        return jsonify({"message": "Chat message added successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/api/metadata/<metadata_id>/flashcards", methods=["POST"])
def add_flashcard(metadata_id):
    try:
        data = request.get_json()
        Metadata.add_flashcard(
            metadata_id=metadata_id,
            question=data["question"],
            answer=data["answer"]
        )
        return jsonify({"message": "Flashcard added successfully"}), 200
    except Exception as e:
        return jsonify({"error": "Internal server error"}), 500

@app.route("/chat/<task_id>", methods=["POST"])
def chat_endpoint(task_id):
    """Handle chat questions using LangChain conversation with context."""
    if task_id not in processing_tasks:
        logger.error(f"Task not found: {task_id}")
        return jsonify({"error": "Task not found"}), 404
    
    task = processing_tasks[task_id]
    
    # Check if the task is completed
    if task["status"] != "completed":
        logger.error(f"Cannot chat with task in status: {task['status']}")
        return jsonify({"error": f"Cannot chat with task in status: {task['status']}"}), 400
    
    # Check if we have the necessary data
    if "results" not in task or "notes" not in task["results"]:
        logger.error(f"No notes found for task: {task_id}")
        return jsonify({"error": "No notes found for this task"}), 400
    
    try:
        # Get the question from the request
        data = request.get_json()
        if not data or "question" not in data:
            logger.error("No question provided in request")
            return jsonify({"error": "No question provided"}), 400
        
        question = data["question"]
        
        # Use the generated notes as context
        context = task["results"]["notes"]
        
        # Generate response using LangChain
        response = chat_with_context(task_id, context, question)
        
        return jsonify({
            "status": "success",
            "response": response
        }), 200
        
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error in chat endpoint: {str(e)}"}), 500

@app.route("/chat/<task_id>/clear", methods=["POST"])
def clear_chat_endpoint(task_id):
    """Clear the conversation history for a specific task."""
    try:
        clear_conversation(task_id)
        return jsonify({
            "status": "success",
            "message": "Conversation history cleared"
        }), 200
    except Exception as e:
        logger.error(f"Error clearing conversation: {str(e)}", exc_info=True)
        return jsonify({"error": f"Error clearing conversation: {str(e)}"}), 500

@app.route("/youtube", methods=["POST"])
def process_youtube():
    """Handles YouTube video processing."""
    try:
        data = request.get_json()
        if not data or "url" not in data:
            logger.error("No URL provided in request")
            return jsonify({"error": "No URL provided"}), 400

        url = data["url"]
        
        # Generate unique task ID
        task_id = str(uuid.uuid4())
        
        # Check if this URL is already in the cache
        cached_results = get_cached_results(url)
        if cached_results:
            # Initialize task status with cached results
            processing_tasks[task_id] = {
                "status": "completed",
                "url": url,
                "results": cached_results,
                "cached": True
            }
            
            return jsonify({
                "message": "URL found in cache",
                "task_id": task_id,
                "status": "completed",
                "cached": True
            }), 200

        # Initialize task status
        processing_tasks[task_id] = {
            "status": "uploaded",
            "url": url
        }
        
        # Start processing in background thread
        thread = threading.Thread(
            target=process_youtube_video,
            args=(task_id, url)
        )
        thread.start()
        
        return jsonify({
            "message": "YouTube video processing started",
            "task_id": task_id,
            "status": "uploaded"
        }), 200

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return jsonify({"error": f"Unexpected error: {str(e)}"}), 500

@app.route('/history', methods=['GET'])
def get_history():
    try:
        # Get all history documents, sorted by timestamp
        history = list(mongo.db.processing_history.find(
            {}, 
            {'_id': 0}  # Exclude MongoDB _id
        ).sort('timestamp', -1))  # Sort by newest first
        
        return jsonify(history)
    except Exception as e:
        logger.error(f"Error fetching history: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/history/<task_id>', methods=['GET'])
def get_history_item(task_id):
    try:
        # Find the specific history document
        history_item = mongo.db.processing_history.find_one(
            {'task_id': task_id},
            {'_id': 0}  # Exclude MongoDB _id
        )
        
        if history_item:
            # If it's a PDF file, include the file data
            if history_item['file_info']['type'] == 'pdf':
                # Get the PDF file path from the upload folder
                pdf_filename = history_item['file_info']['filename']
                pdf_path = os.path.join(UPLOAD_FOLDER, f"{task_id}_{pdf_filename}")
                
                if os.path.exists(pdf_path):
                    # Read the PDF file and encode it as base64
                    with open(pdf_path, 'rb') as pdf_file:
                        pdf_data = pdf_file.read()
                        history_item['file'] = base64.b64encode(pdf_data).decode('utf-8')
            
            return jsonify(history_item)
        else:
            return jsonify({"error": "History item not found"}), 404
    except Exception as e:
        logger.error(f"Error fetching history item: {e}")
        return jsonify({"error": str(e)}), 500

# ==========================================
# FEATURE 1: AI TUTOR
# ==========================================
tutor_conversations = {}

@app.route("/api/tutor/chat", methods=["POST"])
def tutor_chat():
    """AI Tutor - context-aware doubt solving chat"""
    try:
        data = request.json
        message = data.get("message", "")
        history = data.get("history", [])
        
        if not message:
            return jsonify({"error": "Message is required"}), 400
        
        # Build conversation context
        conversation = "You are an expert AI tutor for students. You explain concepts clearly with examples. Use markdown formatting for better readability. If a student asks a question, provide detailed yet easy-to-understand explanations. Include relevant examples, analogies, and key formulas where applicable.\n\n"
        
        for msg in history[-10:]:  # Keep last 10 messages for context
            role = "Student" if msg.get("role") == "user" else "Tutor"
            conversation += f"{role}: {msg.get('content', '')}\n"
        
        conversation += f"Student: {message}\nTutor:"
        
        response = chat_with_context(conversation)
        
        return jsonify({"response": response})
    except Exception as e:
        logger.error(f"Tutor chat error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/tutor/clear", methods=["POST"])
def tutor_clear():
    """Clear tutor conversation"""
    return jsonify({"message": "Conversation cleared"})


# ==========================================
# FEATURE 2: STUDY PLANNER
# ==========================================

@app.route("/api/planner/generate", methods=["POST"])
def generate_study_plan():
    """Generate a personalized study plan using AI"""
    try:
        data = request.json
        exam_name = data.get("examName", "")
        exam_date = data.get("examDate", "")
        subjects = data.get("subjects", "")
        weak_areas = data.get("weakAreas", "")
        daily_hours = data.get("dailyHours", 4)
        
        if not exam_name or not exam_date or not subjects:
            return jsonify({"error": "Exam name, date, and subjects are required"}), 400
        
        prompt = f"""Generate a detailed daily study plan as a JSON object. Return ONLY valid JSON, no other text.

Exam: {exam_name}
Exam Date: {exam_date}
Subjects/Topics: {subjects}
Weak Areas: {weak_areas if weak_areas else 'None specified'}
Daily Study Hours: {daily_hours}

Return this exact JSON format:
{{
  "planName": "Study Plan for {exam_name}",
  "totalDays": <number>,
  "dailyHours": {daily_hours},
  "schedule": [
    {{
      "day": 1,
      "date": "YYYY-MM-DD",
      "topics": [
        {{
          "subject": "Subject Name",
          "topic": "Specific Topic",
          "duration": "2 hours",
          "priority": "high/medium/low",
          "tips": "Brief study tip"
        }}
      ]
    }}
  ],
  "weeklyGoals": ["Goal 1", "Goal 2"],
  "tips": ["General tip 1", "General tip 2"]
}}

Create a realistic schedule covering all subjects, prioritizing weak areas. Limit to 14 days max."""

        response = chat_with_context(prompt)
        
        # Parse JSON from response
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start >= 0 and end > start:
                plan_data = json.loads(response[start:end])
            else:
                plan_data = {"planName": f"Study Plan for {exam_name}", "schedule": [], "tips": ["Plan generation failed, please retry"]}
        except json.JSONDecodeError:
            plan_data = {"planName": f"Study Plan for {exam_name}", "schedule": [], "tips": ["Plan generation failed, please retry"]}
        
        # Save to MongoDB
        plan_doc = {
            "examName": exam_name,
            "examDate": exam_date,
            "subjects": subjects,
            "weakAreas": weak_areas,
            "dailyHours": daily_hours,
            "plan": plan_data,
            "createdAt": datetime.now(timezone.utc).isoformat(),
            "userId": data.get("userId", "anonymous")
        }
        
        result = mongo.db.study_plans.insert_one(plan_doc)
        plan_data["_id"] = str(result.inserted_id)
        
        return jsonify(plan_data)
    except Exception as e:
        logger.error(f"Study planner error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/planner/list", methods=["GET"])
def list_study_plans():
    """List all saved study plans"""
    try:
        plans = list(mongo.db.study_plans.find().sort("createdAt", -1).limit(10))
        for plan in plans:
            plan["_id"] = str(plan["_id"])
        return jsonify(plans)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/planner/<plan_id>", methods=["GET"])
def get_study_plan(plan_id):
    """Get a specific study plan"""
    try:
        plan = mongo.db.study_plans.find_one({"_id": ObjectId(plan_id)})
        if plan:
            plan["_id"] = str(plan["_id"])
            return jsonify(plan)
        return jsonify({"error": "Plan not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/planner/<plan_id>/rebalance", methods=["PUT"])
def rebalance_study_plan(plan_id):
    """Rebalance a study plan based on progress"""
    try:
        data = request.json
        completed_topics = data.get("completedTopics", [])
        new_weak_areas = data.get("newWeakAreas", "")
        
        plan = mongo.db.study_plans.find_one({"_id": ObjectId(plan_id)})
        if not plan:
            return jsonify({"error": "Plan not found"}), 404
        
        prompt = f"""Rebalance this study plan. Some topics are completed, focus remaining time on incomplete and weak areas.
Return ONLY valid JSON in the same format as before.

Original exam: {plan.get('examName')}
Exam date: {plan.get('examDate')}
Subjects: {plan.get('subjects')}
Completed topics: {', '.join(completed_topics) if completed_topics else 'None'}
New weak areas: {new_weak_areas if new_weak_areas else 'None'}
Daily hours: {plan.get('dailyHours', 4)}

Return JSON with planName, schedule (array of days with topics), and tips."""

        response = chat_with_context(prompt)
        
        try:
            start = response.find('{')
            end = response.rfind('}') + 1
            if start >= 0 and end > start:
                new_plan = json.loads(response[start:end])
            else:
                return jsonify({"error": "Failed to generate rebalanced plan"}), 500
        except json.JSONDecodeError:
            return jsonify({"error": "Failed to parse rebalanced plan"}), 500
        
        mongo.db.study_plans.update_one(
            {"_id": ObjectId(plan_id)},
            {"$set": {"plan": new_plan, "updatedAt": datetime.now(timezone.utc).isoformat()}}
        )
        
        new_plan["_id"] = plan_id
        return jsonify(new_plan)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# FEATURE 3: ADAPTIVE PRACTICE
# ==========================================

@app.route("/api/practice/generate", methods=["POST"])
def generate_practice():
    """Generate practice questions from a topic"""
    try:
        data = request.json
        topic = data.get("topic", "")
        num_questions = data.get("numQuestions", 5)
        difficulty = data.get("difficulty", "medium")
        
        if not topic:
            return jsonify({"error": "Topic is required"}), 400
        
        prompt = f"""Generate {num_questions} practice questions about: {topic}
Difficulty: {difficulty}

Return ONLY a JSON array, no other text. Each question must have this format:
[
  {{
    "id": 1,
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Brief explanation of why the answer is correct",
    "topic": "{topic}",
    "difficulty": "{difficulty}"
  }}
]"""

        response = chat_with_context(prompt)
        
        try:
            start = response.find('[')
            end = response.rfind(']') + 1
            if start >= 0 and end > start:
                questions = json.loads(response[start:end])
            else:
                questions = []
        except json.JSONDecodeError:
            questions = []
        
        # Add IDs if missing
        for i, q in enumerate(questions):
            if "id" not in q:
                q["id"] = i + 1
        
        return jsonify({"questions": questions, "topic": topic})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/practice/upload", methods=["POST"])
def practice_from_file():
    """Extract and generate questions from uploaded PDF"""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files["file"]
        if not file.filename.endswith(".pdf"):
            return jsonify({"error": "Only PDF files are supported"}), 400
        
        # Read PDF
        reader = PdfReader(file)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        
        if not text.strip():
            return jsonify({"error": "Could not extract text from PDF"}), 400
        
        # Truncate text
        text = text[:5000]
        
        num_questions = int(request.form.get("numQuestions", 5))
        
        prompt = f"""Based on this document content, generate {num_questions} practice questions as flashcards.
Return ONLY a JSON array, no other text.

Document content:
{text}

Format:
[
  {{
    "id": 1,
    "question": "Question from the document",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Why this is correct",
    "topic": "Auto-detected topic",
    "difficulty": "medium"
  }}
]"""

        response = chat_with_context(prompt)
        
        try:
            start = response.find('[')
            end = response.rfind(']') + 1
            if start >= 0 and end > start:
                questions = json.loads(response[start:end])
            else:
                questions = []
        except json.JSONDecodeError:
            questions = []
        
        for i, q in enumerate(questions):
            if "id" not in q:
                q["id"] = i + 1
        
        return jsonify({"questions": questions, "source": file.filename})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/practice/submit", methods=["POST"])
def submit_practice():
    """Submit practice answers and analyze weak areas"""
    try:
        data = request.json
        answers = data.get("answers", [])
        questions = data.get("questions", [])
        
        if not answers or not questions:
            return jsonify({"error": "Answers and questions required"}), 400
        
        # Analyze results
        total = len(questions)
        correct = 0
        weak_topics = {}
        results = []
        
        for q in questions:
            qid = q.get("id", 0)
            user_answer = None
            time_taken = 0
            
            for a in answers:
                if a.get("questionId") == qid:
                    user_answer = a.get("answer")
                    time_taken = a.get("timeTaken", 0)
                    break
            
            is_correct = user_answer == q.get("correctAnswer")
            if is_correct:
                correct += 1
            else:
                topic = q.get("topic", "General")
                weak_topics[topic] = weak_topics.get(topic, 0) + 1
            
            results.append({
                "questionId": qid,
                "correct": is_correct,
                "userAnswer": user_answer,
                "correctAnswer": q.get("correctAnswer"),
                "explanation": q.get("explanation", ""),
                "timeTaken": time_taken
            })
        
        # Save session to MongoDB
        session = {
            "answers": results,
            "score": correct,
            "total": total,
            "accuracy": round((correct / total) * 100, 1) if total > 0 else 0,
            "weakTopics": weak_topics,
            "createdAt": datetime.now(timezone.utc).isoformat()
        }
        
        mongo.db.practice_sessions.insert_one(session)
        session.pop("_id", None)
        
        return jsonify(session)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/practice/targeted", methods=["POST"])
def targeted_practice():
    """Generate targeted questions for weak areas"""
    try:
        data = request.json
        weak_topics = data.get("weakTopics", {})
        
        if not weak_topics:
            return jsonify({"error": "No weak topics provided"}), 400
        
        topics_str = ", ".join(weak_topics.keys())
        
        prompt = f"""Generate 5 targeted practice questions focusing on these weak areas: {topics_str}
Make these questions slightly easier to help the student build confidence.
Return ONLY a JSON array, no other text.

Format:
[
  {{
    "id": 1,
    "question": "Question text",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "Explanation",
    "topic": "Topic name",
    "difficulty": "easy"
  }}
]"""

        response = chat_with_context(prompt)
        
        try:
            start = response.find('[')
            end = response.rfind(']') + 1
            if start >= 0 and end > start:
                questions = json.loads(response[start:end])
            else:
                questions = []
        except json.JSONDecodeError:
            questions = []
        
        for i, q in enumerate(questions):
            if "id" not in q:
                q["id"] = i + 1
        
        return jsonify({"questions": questions, "focus": topics_str})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    logger.info(f"🚀 Server running on http://127.0.0.1:{PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=True)
