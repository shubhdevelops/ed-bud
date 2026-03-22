from pytube import YouTube
from youtube_transcript_api import YouTubeTranscriptApi
import os
import logging
import re

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_video_id(url):
    """Extract video ID from YouTube URL."""
    patterns = [
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*',
        r'^([0-9A-Za-z_-]{11})$',
        r'(?:embed\/)([0-9A-Za-z_-]{11})',
        r'(?:watch\?v=)([0-9A-Za-z_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_transcript(video_id):
    """Get transcript from YouTube video."""
    try:
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        if not transcript_list:
            return None
            
        # Combine all transcript segments into a single text
        full_text = " ".join([segment["text"] for segment in transcript_list])
        return {
            "text": full_text,
            "segments": transcript_list
        }
    except Exception as e:
        logger.error(f"Error getting transcript: {str(e)}")
        return None

def download_audio(url, output_path):
    """Download audio from YouTube video."""
    try:
        yt = YouTube(url)
        video = yt.streams.filter(only_audio=True).first()
        if not video:
            raise Exception("No audio stream found")
            
        # Download the audio
        audio_file = video.download(output_path=output_path)
        
        # Rename to .mp3
        base, _ = os.path.splitext(audio_file)
        mp3_file = base + ".mp3"
        os.rename(audio_file, mp3_file)
        
        return mp3_file
    except Exception as e:
        logger.error(f"Error downloading audio: {str(e)}")
        raise

def process_youtube_video(url, output_dir):
    """Process YouTube video and return transcript or audio file path."""
    try:
        video_id = extract_video_id(url)
        if not video_id:
            raise ValueError("Invalid YouTube URL")
            
        # Try to get transcript first
        transcript = get_transcript(video_id)
        if transcript:
            logger.info("Successfully retrieved transcript from YouTube")
            return {
                "type": "transcript",
                "data": transcript
            }
            
        # If no transcript, download audio
        logger.info("No transcript available, downloading audio")
        audio_path = download_audio(url, output_dir)
        return {
            "type": "audio",
            "data": audio_path
        }
        
    except Exception as e:
        logger.error(f"Error processing YouTube video: {str(e)}")
        raise 