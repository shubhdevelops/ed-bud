import os
import logging
import time
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# Same fallback chain as gemini_integration
FREE_MODELS = [
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
]


def chat_with_context(prompt):
    """Generate a response using OpenRouter with model fallback."""
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudyBuddy",
    }

    for model in FREE_MODELS:
        try:
            response = requests.post(
                OPENROUTER_BASE_URL,
                headers=headers,
                json={"model": model, "messages": [{"role": "user", "content": prompt}]},
                timeout=90,
            )
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            elif response.status_code == 429:
                logger.warning(f"Chat: {model} rate-limited. Trying next...")
                time.sleep(2)
                continue
        except Exception:
            continue

    return "Sorry, AI is temporarily busy. Please try again in a moment."


def clear_conversation():
    return "Conversation cleared"