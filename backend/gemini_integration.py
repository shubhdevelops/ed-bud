import google.generativeai as genai
import os
import logging
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configure the Gemini API
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

def generate_notes(transcript_text):
    """
    Generate detailed lecture notes using Google's Gemini model.
    
    Args:
        transcript_text (str): The transcript text to generate notes from
        
    Returns:
        str: Generated notes in markdown format
    """
    try:
        # Initialize the model - using gemini-1.5-pro which is the latest supported model
        logger.info("Initializing Gemini model")
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Create the prompt
        prompt = f"""You are an AI that generates detailed, structured, and accurate lecture notes from transcriptions. 
        Minimum 2-3 page response is required. The format must be markdown that can be embedded into a website. 
        Add proper line breaks and bullet points for lists, subtopics, and lines to look it good. 
        You may add information that is not present in the transcription, but ensure it is relevant and accurate.

        Generate detailed and structured lecture notes from the following transcription:
        {transcript_text}

        Please follow these guidelines:
        - Organize the notes into clear sections (e.g., Introduction, Key Concepts, Examples, Summary)
        - Include definitions, explanations, and key points made by the lecturer
        - Ensure the notes are comprehensive, accurate, and coherent
        - Break down complex ideas into simpler terms
        - Use bullet points for lists and subtopics
        - If possible, highlight any key takeaways or important conclusions
        - Maintain the authenticity of the information provided in the transcription
        """
        
        # Generate the response
        logger.info("Generating content with Gemini")
        response = model.generate_content(prompt)
        logger.info("Content generation successful")
        
        # Save to file for caching
        with open("outputs/llm_output.txt", "w") as file:
            file.write(response.text)
            file.close()
        
        return response.text
    except Exception as e:
        logger.error(f"Error generating notes with Gemini: {str(e)}", exc_info=True)
        # Return a fallback response in case of error
        return f"Error generating notes: {str(e)}"

def generate_flashcards(transcript_text):
    """Generate flashcards from transcript text using Gemini."""
    try:
        logger.info("Starting flashcard generation")
        
        # Initialize the model
        logger.info("Initializing Gemini model")
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Construct the prompt for Gemini
        prompt = f"""Based on the following transcript, generate 5-7 meaningful flashcards.
        Each flashcard should have a question on the front and a concise answer on the back.
        Focus on key concepts, definitions, and important points.
        Format the response as a JSON array of objects with 'question' and 'answer' fields.
        Do not include any markdown formatting or code block syntax.

        Transcript:
        {transcript_text}

        Example format:
        [
            {{
                "question": "What is the main topic discussed?",
                "answer": "The main topic is..."
            }},
            {{
                "question": "What are the key points about X?",
                "answer": "The key points are..."
            }}
        ]"""

        # Get response from Gemini
        response = model.generate_content(prompt)
        logger.info("Received response from Gemini")
        
        # Clean the response text to remove any markdown formatting
        response_text = response.text
        if response_text.startswith("```json"):
            response_text = response_text[7:]  # Remove ```json
        if response_text.startswith("```"):
            response_text = response_text[3:]  # Remove ```
        if response_text.endswith("```"):
            response_text = response_text[:-3]  # Remove trailing ```
        
        # Strip any leading/trailing whitespace
        response_text = response_text.strip()
        
        try:
            # Parse the cleaned JSON
            flashcards = json.loads(response_text)
            logger.info(f"Successfully generated {len(flashcards)} flashcards")
            return flashcards
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing flashcard JSON: {str(e)}")
            logger.error(f"Failed to parse JSON: {response_text}")
            return []
            
    except Exception as e:
        logger.error(f"Error generating flashcards: {str(e)}")
        return [] 

def generate_mindmap(transcript_text):
    """Generate a mind map structure from transcript text using Gemini."""
    try:
        logger.info("Starting mind map generation")
        
        # Initialize the model
        logger.info("Initializing Gemini model")
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Construct the prompt for Gemini
        prompt = f"""Based on the following transcript, generate a well-structured mind map.
        Follow these specific guidelines for the mind map structure:

        1. Central Topic:
           - Should be the main subject/concept from the transcript
           - Keep it concise but descriptive

        2. Main Branches (4-6 branches):
           - Each branch should represent a major category or aspect
           - Use single words or short phrases
           - Common categories include: Key Concepts, Applications, Components, Principles, Methods, etc.

        3. Sub-branches:
           - Each main branch should have 2-4 sub-branches
           - Use clear, concise terms
           - Should directly relate to the parent branch
           - Can include specific examples, details, or characteristics

        4. Visual Organization:
           - Ensure logical grouping of related concepts
           - Maintain consistent level of detail across branches
           - Use clear hierarchical relationships

        Format the response as a JSON object with this exact structure:
        {{
            "topic": "Central Topic",
            "branches": [
                {{
                    "name": "Main Branch 1",
                    "type": "concept",  // concept, method, principle, application, etc.
                    "subbranches": [
                        {{ 
                            "name": "Sub-branch 1.1",
                            "description": "Brief explanation if needed"
                        }}
                    ]
                }}
            ]
        }}

        Analyze this transcript and create a comprehensive mind map:
        {transcript_text}

        Remember:
        - Keep all text concise and clear
        - Ensure logical connections between concepts
        - Use meaningful branch types
        - Focus on key concepts and their relationships
        - Return ONLY the JSON object, no additional text or explanations"""

        # Get response from Gemini
        response = model.generate_content(prompt)
        logger.info("Received response from Gemini")
        
        # Clean the response text to remove any markdown formatting
        response_text = response.text.strip()
        
        # Remove any markdown code block syntax
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        
        # Find the first '{' and last '}' to extract just the JSON object
        start_idx = response_text.find('{')
        end_idx = response_text.rfind('}')
        
        if start_idx == -1 or end_idx == -1:
            raise ValueError("No valid JSON object found in response")
            
        response_text = response_text[start_idx:end_idx + 1].strip()
        
        try:
            # Parse the cleaned JSON
            mindmap = json.loads(response_text)
            
            # Validate the structure
            if not isinstance(mindmap, dict) or 'topic' not in mindmap or 'branches' not in mindmap:
                raise ValueError("Invalid mind map structure")
            
            # Validate and process each branch
            for branch in mindmap['branches']:
                if not isinstance(branch, dict) or 'name' not in branch:
                    raise ValueError("Invalid branch structure")
                
                # Ensure type exists
                if 'type' not in branch:
                    branch['type'] = 'concept'
                
                # Validate subbranches
                if 'subbranches' in branch:
                    if not isinstance(branch['subbranches'], list):
                        branch['subbranches'] = []
                    else:
                        # Ensure each subbranch has required fields
                        for subbranch in branch['subbranches']:
                            if not isinstance(subbranch, dict) or 'name' not in subbranch:
                                branch['subbranches'].remove(subbranch)
                            if 'description' not in subbranch:
                                subbranch['description'] = ""
                else:
                    branch['subbranches'] = []
            
            logger.info("Successfully generated and validated mind map structure")
            return mindmap
            
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing mind map JSON: {str(e)}")
            logger.error(f"Failed to parse JSON: {response_text}")
            return {
                "topic": "Error in Mind Map Generation",
                "branches": [
                    {
                        "name": "Error",
                        "type": "error",
                        "subbranches": [
                            {
                                "name": "Failed to parse response",
                                "description": str(e)
                            }
                        ]
                    }
                ]
            }
            
    except Exception as e:
        logger.error(f"Error generating mind map: {str(e)}")
        return {
            "topic": "Error in Mind Map Generation",
            "branches": [
                {
                    "name": "Error",
                    "type": "error",
                    "subbranches": [
                        {
                            "name": "Generation failed",
                            "description": str(e)
                        }
                    ]
                }
            ]
        } 

def generate_quiz(transcript_text):
    """
    Generate quiz questions based on the transcript text.
    
    Args:
        transcript_text (str): The transcript text to generate quiz questions from
        
    Returns:
        list: A list of quiz questions with multiple choice options
    """
    try:
        # Initialize the model
        logger.info("Initializing Gemini model for quiz generation")
        model = genai.GenerativeModel('gemini-1.5-pro')
        
        # Create the prompt
        prompt = f"""You are an AI that generates meaningful multiple-choice quiz questions from transcriptions.
        
        Generate 5 multiple-choice quiz questions from the following transcription:
        {transcript_text}
        
        Please follow these guidelines:
        - Each question should have 4 options (A, B, C, D)
        - One option should be the correct answer
        - The questions should test understanding of key concepts from the transcript
        - The questions should be challenging but fair
        - The options should be plausible and related to the topic
        - Format the response as a JSON array with the following structure:
          [
            {{
              "question": "The question text",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correctAnswer": 0  // Index of the correct answer (0-3)
            }},
            ...
          ]
        """
        
        # Generate the response
        logger.info("Generating quiz questions with Gemini")
        response = model.generate_content(prompt)
        
        # Extract the response text
        response_text = response.text
        
        # Parse the JSON response
        try:
            # Find the JSON part in the response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                quiz_data = json.loads(json_str)
                logger.info(f"Successfully generated {len(quiz_data)} quiz questions")
                return quiz_data
            else:
                logger.error("Could not find JSON in response")
                return []
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing JSON: {e}")
            logger.error(f"Response text: {response_text}")
            return []
            
    except Exception as e:
        logger.error(f"Error generating quiz: {e}")
        return [] 