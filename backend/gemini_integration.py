import os
import logging
import json
import time
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- API Configuration ---
# We support two providers: Groq (preferred) and OpenRouter (fallback)
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# Groq free-tier models (30 req/min, very fast)
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
]

# OpenRouter free models (fallback)
OPENROUTER_MODELS = [
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "google/gemma-3-12b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
]


def _call_groq(prompt, max_retries=2):
    """Call Groq API — very fast, generous free tier."""
    if not GROQ_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    for model in GROQ_MODELS:
        for attempt in range(max_retries):
            try:
                logger.info(f"Groq: trying {model} (attempt {attempt + 1})")
                response = requests.post(
                    GROQ_BASE_URL,
                    headers=headers,
                    json={
                        "model": model,
                        "messages": [{"role": "user", "content": prompt}],
                        "max_tokens": 4096,
                    },
                    timeout=60,
                )

                if response.status_code == 200:
                    data = response.json()
                    content = data["choices"][0]["message"]["content"]
                    logger.info(f"Groq success with {model}")
                    return content
                elif response.status_code == 429:
                    logger.warning(f"Groq {model} rate-limited. Waiting 10s...")
                    time.sleep(10)
                    continue
                else:
                    logger.warning(f"Groq {model}: {response.status_code}")
                    break  # Try next model
            except requests.exceptions.Timeout:
                logger.warning(f"Groq {model} timed out")
                break
            except Exception as e:
                logger.warning(f"Groq {model} error: {str(e)}")
                break

    return None


def _call_openrouter(prompt):
    """Call OpenRouter API as fallback."""
    if not OPENROUTER_API_KEY:
        return None

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudyBuddy",
    }

    for model in OPENROUTER_MODELS:
        try:
            response = requests.post(
                OPENROUTER_BASE_URL,
                headers=headers,
                json={"model": model, "messages": [{"role": "user", "content": prompt}]},
                timeout=60,
            )
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except Exception:
            continue

    return None


def _call_llm(prompt):
    """Call LLM — tries Groq first, then OpenRouter."""
    # Try Groq first (faster, better free tier)
    result = _call_groq(prompt)
    if result:
        return result

    # Fallback to OpenRouter
    result = _call_openrouter(prompt)
    if result:
        return result

    return None


def generate_notes(transcript_text):
    """Generate detailed lecture notes."""
    try:
        logger.info("Generating notes")

        prompt = f"""You are an AI that generates detailed, structured lecture notes from transcriptions.
The format must be markdown. Add proper sections, bullet points, and formatting.

Generate detailed lecture notes from this transcription:
{transcript_text}

Guidelines:
- Organize into sections (Introduction, Key Concepts, Examples, Summary)
- Include definitions and key points
- Use bullet points for lists
- Highlight key takeaways
"""

        result = _call_llm(prompt)

        if result:
            logger.info("Notes generation successful")
            os.makedirs("outputs", exist_ok=True)
            with open("outputs/llm_output.txt", "w", encoding="utf-8") as file:
                file.write(result)
            return result

        # Fallback: return formatted transcript
        fallback = "## Notes\n\n*(AI notes generation temporarily unavailable — showing raw transcript)*\n\n"
        fallback += str(transcript_text)[:5000]
        return fallback
    except Exception as e:
        logger.error(f"Error generating notes: {str(e)}", exc_info=True)
        fallback = "## Notes\n\n*(AI notes generation failed — showing raw transcript)*\n\n"
        fallback += str(transcript_text)[:5000]
        return fallback


def generate_flashcards(transcript_text):
    """Generate flashcards from transcript text."""
    try:
        logger.info("Starting flashcard generation")

        prompt = f"""Generate 5-7 flashcards from this transcript.
Format as a JSON array with 'question' and 'answer' fields.
Return ONLY the JSON array, no other text.

Transcript:
{transcript_text}"""

        response_text = _call_llm(prompt)
        if not response_text:
            return []

        # Clean markdown code blocks
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()

        start = response_text.find('[')
        end = response_text.rfind(']')
        if start >= 0 and end > start:
            response_text = response_text[start:end + 1]

        try:
            flashcards = json.loads(response_text)
            logger.info(f"Generated {len(flashcards)} flashcards")
            return flashcards
        except json.JSONDecodeError:
            return []

    except Exception as e:
        logger.error(f"Error generating flashcards: {str(e)}")
        return []


def generate_mindmap(transcript_text):
    """Generate a mind map structure from transcript text."""
    try:
        logger.info("Starting mind map generation")

        prompt = f"""Generate a mind map as a JSON object from this transcript.
Return ONLY the JSON, no other text.

Format:
{{"topic": "Central Topic", "branches": [{{"name": "Branch", "type": "concept", "subbranches": [{{"name": "Sub", "description": "Detail"}}]}}]}}

Transcript:
{transcript_text}"""

        response_text = _call_llm(prompt)
        if not response_text:
            return {"topic": "Mind Map", "branches": []}

        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')

        if start_idx == -1 or end_idx == -1:
            return {"topic": "Mind Map", "branches": []}

        response_text = response_text[start_idx:end_idx + 1].strip()
        mindmap = json.loads(response_text)

        if not isinstance(mindmap, dict) or 'topic' not in mindmap:
            return {"topic": "Mind Map", "branches": []}

        for branch in mindmap.get('branches', []):
            if 'type' not in branch:
                branch['type'] = 'concept'
            if 'subbranches' not in branch:
                branch['subbranches'] = []

        return mindmap

    except Exception as e:
        logger.error(f"Error generating mind map: {str(e)}")
        return {"topic": "Mind Map", "branches": []}


def generate_quiz(transcript_text):
    """Generate quiz questions from transcript text."""
    try:
        logger.info("Generating quiz questions")

        prompt = f"""Generate 5 multiple-choice quiz questions as a JSON array.
Return ONLY the JSON, no other text.

Format: [{{"question": "Q", "options": ["A","B","C","D"], "correctAnswer": 0}}]

Transcript:
{transcript_text}"""

        response_text = _call_llm(prompt)
        if not response_text:
            return []

        json_start = response_text.find('[')
        json_end = response_text.rfind(']') + 1

        if json_start >= 0 and json_end > json_start:
            quiz_data = json.loads(response_text[json_start:json_end])
            return quiz_data
        return []

    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return []