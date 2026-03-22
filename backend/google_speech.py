from google.cloud import speech
from google.cloud import storage
import os
import time
import uuid
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def upload_to_gcs(file_path, bucket_name):
    """
    Upload a file to Google Cloud Storage.
    
    Args:
        file_path (str): Path to the local file
        bucket_name (str): Name of the GCS bucket
        
    Returns:
        str: GCS URI of the uploaded file
    """
    try:
        logger.info(f"Initializing GCS client for bucket: {bucket_name}")
        storage_client = storage.Client()
        bucket = storage_client.bucket(bucket_name)
        
        # Generate a unique blob name
        blob_name = f"audio/{uuid.uuid4()}{os.path.splitext(file_path)[1]}"
        logger.info(f"Generated blob name: {blob_name}")
        
        blob = bucket.blob(blob_name)
        
        # Upload the file
        logger.info(f"Uploading file {file_path} to GCS")
        blob.upload_from_filename(file_path)
        logger.info("File upload successful")
        
        # Return the GCS URI
        gcs_uri = f"gs://{bucket_name}/{blob_name}"
        logger.info(f"File available at GCS URI: {gcs_uri}")
        return gcs_uri
        
    except Exception as e:
        logger.error(f"Failed to upload to GCS: {str(e)}", exc_info=True)
        raise

def transcribe_audio(audio_path, language_code="en-US", bucket_name="your-bucket-name"):
    """
    Asynchronously transcribe audio to text using Google Speech-to-Text API.
    
    Args:
        audio_path (str): Path to the audio file
        language_code (str): Language code for transcription (default: "en-US")
        bucket_name (str): Name of the GCS bucket to store audio files
        
    Returns:
        dict: Dictionary containing the transcription and confidence score
    """
    try:
        logger.info(f"Starting transcription process for file: {audio_path}")
        logger.info(f"Using bucket: {bucket_name} and language: {language_code}")
        
        # Check if file exists
        if not os.path.exists(audio_path):
            logger.error(f"Audio file not found: {audio_path}")
            return {
                "text": "",
                "confidence": 0,
                "error": "Audio file not found"
            }
        
        # Upload the audio file to GCS
        gcs_uri = upload_to_gcs(audio_path, bucket_name)
        
        # Initialize the Speech-to-Text client
        logger.info("Initializing Speech-to-Text client")
        client = speech.SpeechClient()
        
        # Configure the recognition request
        logger.info("Configuring recognition request")
        audio = speech.RecognitionAudio(uri=gcs_uri)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.MP3,
            sample_rate_hertz=16000,  # Standard sample rate
            language_code=language_code,
            enable_automatic_punctuation=True,
            enable_word_time_offsets=True,
            enable_word_confidence=True
        )
        
        # Start the long-running operation
        logger.info("Starting long-running recognition operation")
        operation = client.long_running_recognize(config=config, audio=audio)
        
        logger.info("Waiting for operation to complete...")
        response = operation.result(timeout=300)  # Wait up to 5 minutes for completion
        logger.info("Operation completed successfully")
        
        # Extract the transcribed text and confidence scores
        transcription = ""
        confidence_scores = []
        
        logger.info("Processing transcription results")
        for result in response.results:
            for word_info in result.alternatives[0].words:
                transcription += word_info.word + " "
                confidence_scores.append(word_info.confidence)
        
        # Calculate average confidence score
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0
        logger.info(f"Transcription completed with average confidence: {avg_confidence}")
        
        # Clean up the GCS file
        try:
            logger.info("Cleaning up GCS file")
            storage_client = storage.Client()
            bucket = storage_client.bucket(bucket_name)
            blob = bucket.blob(gcs_uri.replace(f"gs://{bucket_name}/", ""))
            blob.delete()
            logger.info("GCS file cleanup successful")
        except Exception as e:
            logger.error(f"Failed to delete GCS file: {str(e)}", exc_info=True)
        
        return {
            "text": transcription.strip(),
            "confidence": avg_confidence
        }
        
    except Exception as e:
        logger.error(f"Failed to transcribe audio: {str(e)}", exc_info=True)
        return {
            "text": "",
            "confidence": 0,
            "error": str(e)
        } 