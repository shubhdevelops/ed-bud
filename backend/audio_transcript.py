import whisper
import json

model = whisper.load_model("base")

def transcribe_audio(audio_path):
    return model.transcribe(audio_path)

def transcribe_audio_timestamped(audio_path):
    result = model.transcribe(audio_path, word_timestamps=True)

    sentence_timestamps = []

    for segment in result["segments"]:
        sentence_data = {
            "text": segment["text"].strip(),
            "start_time": round(segment["start"], 2),
            "end_time": round(segment["end"], 2)
        }
        sentence_timestamps.append(sentence_data)

    json_output = json.dumps(sentence_timestamps, indent=4)
    # print(json_output)
    return json_output
