import os
import logging
import json
import time
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# OpenRouter configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1/chat/completions"

# Multiple free models — if one is rate-limited, try the next
FREE_MODELS = [
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "google/gemma-3-27b-it:free",
    "google/gemma-3-12b-it:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "qwen/qwen3-4b:free",
]


def _call_openrouter(prompt):
    """
    Call OpenRouter API — cycles through free models until one works.
    """
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "StudyBuddy",
    }

    last_error = None

    for model in FREE_MODELS:
        try:
            logger.info(f"Trying model: {model}")

            payload = {
                "model": model,
                "messages": [{"role": "user", "content": prompt}],
            }

            response = requests.post(
                OPENROUTER_BASE_URL,
                headers=headers,
                json=payload,
                timeout=90,
            )

            if response.status_code == 200:
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                logger.info(f"Success with model: {model}")
                return content
            elif response.status_code == 429:
                logger.warning(f"Model {model} rate-limited (429). Trying next...")
                last_error = f"All models rate-limited"
                time.sleep(2)  # Brief pause before trying next model
                continue
            else:
                logger.warning(f"Model {model} returned {response.status_code}. Trying next...")
                last_error = f"API error {response.status_code}"
                continue

        except requests.exceptions.Timeout:
            logger.warning(f"Model {model} timed out. Trying next...")
            last_error = "Timeout"
            continue
        except Exception as e:
            logger.warning(f"Model {model} failed: {str(e)}. Trying next...")
            last_error = str(e)
            continue

    # All models failed — wait 30s and retry the first model once more
    logger.warning("All models failed. Waiting 30s for rate limit reset...")
    time.sleep(30)

    try:
        payload = {
            "model": FREE_MODELS[0],
            "messages": [{"role": "user", "content": prompt}],
        }
        response = requests.post(
            OPENROUTER_BASE_URL,
            headers=headers,
            json=payload,
            timeout=90,
        )
        if response.status_code == 200:
            data = response.json()
            return data["choices"][0]["message"]["content"]
    except Exception:
        pass

    raise Exception(f"All OpenRouter models failed: {last_error}")


def generate_notes(transcript_text):
    """Generate detailed lecture notes using OpenRouter."""
    try:
        logger.info("Generating notes via OpenRouter")

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

        result = _call_openrouter(prompt)
        logger.info("Notes generation successful")

        with open("outputs/llm_output.txt", "w", encoding="utf-8") as file:
            file.write(result)

        return result
    except Exception as e:
        logger.error(f"Error generating notes: {str(e)}", exc_info=True)
        # Fallback: return formatted transcript so user always sees content
        fallback = "## Notes\n\n*(AI notes generation temporarily unavailable — showing raw transcript)*\n\n"
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

        response_text = _call_openrouter(prompt)

        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]

        response_text = response_text.strip()

        # Find JSON array in response
        start = response_text.find('[')
        end = response_text.rfind(']')
        if start >= 0 and end > start:
            response_text = response_text[start:end + 1]

        try:
            flashcards = json.loads(response_text)
            logger.info(f"Generated {len(flashcards)} flashcards")
            return flashcards
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing flashcard JSON: {str(e)}")
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

        response_text = _call_openrouter(prompt)
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
            raise ValueError("No JSON found in response")

        response_text = response_text[start_idx:end_idx + 1].strip()

        mindmap = json.loads(response_text)

        if not isinstance(mindmap, dict) or 'topic' not in mindmap:
            raise ValueError("Invalid mind map structure")

        for branch in mindmap.get('branches', []):
            if 'type' not in branch:
                branch['type'] = 'concept'
            if 'subbranches' not in branch:
                branch['subbranches'] = []

        logger.info("Successfully generated mind map")
        return mindmap

    except Exception as e:
        logger.error(f"Error generating mind map: {str(e)}")
        return {
            "topic": "Mind Map",
            "branches": [{"name": "Error", "type": "error", "subbranches": [{"name": "Generation failed", "description": str(e)}]}]
        }


def generate_quiz(transcript_text):
    """Generate quiz questions from transcript text."""
    try:
        logger.info("Generating quiz questions")

        prompt = f"""Generate 5 multiple-choice quiz questions as a JSON array.
Return ONLY the JSON, no other text.

Format: [{{"question": "Q", "options": ["A","B","C","D"], "correctAnswer": 0}}]

Transcript:
{transcript_text}"""

        response_text = _call_openrouter(prompt)

        json_start = response_text.find('[')
        json_end = response_text.rfind(']') + 1

        if json_start >= 0 and json_end > json_start:
            quiz_data = json.loads(response_text[json_start:json_end])
            logger.info(f"Generated {len(quiz_data)} quiz questions")
            return quiz_data
        return []

    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return []