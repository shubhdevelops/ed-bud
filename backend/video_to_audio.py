from moviepy.video.io.VideoFileClip import VideoFileClip

# video_path = "Reinforcement_Learning.mp4"
# audio_output = "output_audio.mp3"

# clip = VideoFileClip(video_path)
# clip.audio.write_audiofile(audio_output)

def convert_video_to_audio(video_path, audio_output):
    clip = VideoFileClip(video_path)
    clip.audio.write_audiofile(audio_output)