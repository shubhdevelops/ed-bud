import os
import logging
import time
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

GROQ_MODELS = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "gemma2-9b-it"]

OPENROUTER_MODELS = [
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "google/gemma-3-12b-it:free",
]


def chat_with_context(prompt):
    """Generate a response — tries Groq first, then OpenRouter."""

    # Try Groq first
    if GROQ_API_KEY:
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        for model in GROQ_MODELS:
            for attempt in range(2):
                try:
                    logger.info(f"Chat Groq: {model} (attempt {attempt + 1})")
                    r = requests.post(
                        GROQ_BASE_URL,
                        headers=headers,
                        json={
                            "model": model,
                            "messages": [{"role": "user", "content": prompt}],
                            "max_tokens": 4096,
                        },
                        timeout=60,
                    )
                    if r.status_code == 200:
                        return r.json()["choices"][0]["message"]["content"]
                    elif r.status_code == 429:
                        logger.warning(f"Groq {model} rate-limited, waiting 10s")
                        time.sleep(10)
                    else:
                        break
                except Exception:
                    break

    # Fallback to OpenRouter
    if OPENROUTER_API_KEY:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
        }
        for model in OPENROUTER_MODELS:
            try:
                r = requests.post(
                    OPENROUTER_BASE_URL,
                    headers=headers,
                    json={"model": model, "messages": [{"role": "user", "content": prompt}]},
                    timeout=60,
                )
                if r.status_code == 200:
                    return r.json()["choices"][0]["message"]["content"]
            except Exception:
                continue

    return "I'm sorry, the AI service is temporarily unavailable. Please check your API key in the .env file (GROQ_API_KEY recommended)."


def clear_conversation():
    return "Conversation cleared"