import docker
from sqlalchemy.orm import Session
from . import models
from .config import settings
import json
import os

client = docker.from_env()

def launch_bot(meeting: models.Meeting):
    container_name = f"meno-bot-{meeting.id}"
    
    env_vars = {
        "MEETING_ID": meeting.meeting_id,
        "MEETING_PWD": meeting.meeting_pwd or "",
        "BOT_NAME": meeting.bot_name,
        "ZOOM_SDK_KEY": settings.ZOOM_SDK_KEY,
        "ZOOM_SDK_SECRET": settings.ZOOM_SDK_SECRET,
        "WHISPER_MODEL": settings.WHISPER_MODEL,
        "HF_TOKEN": settings.HF_TOKEN,
        "MEETING_DB_ID": str(meeting.id),
        "PLAYWRIGHT_BROWSERS_PATH": "/opt/pw-browsers"
    }

    # Use absolute host paths in development, but in compose relative paths might behave differently
    # Let's map ./data from the host logic
    # In a real environment, this depends on where the docker daemon thinks ./data is.
    # Usually passed as an absolute path from the environment.
    host_data_dir = os.environ.get("HOST_DATA_DIR", "./data")
    volumes = {
        host_data_dir: {'bind': '/data', 'mode': 'rw'},
        'meno-whisper-cache': {'bind': '/root/.cache/huggingface', 'mode': 'rw'}
    }

    try:
        container = client.containers.run(
            "meno-bot",
            detach=True,
            name=container_name,
            environment=env_vars,
            volumes=volumes
        )
        return container
    except Exception as e:
        print(f"Error launching bot: {e}")
        return None

def check_bot_status(meeting: models.Meeting, db: Session):
    container_name = f"meno-bot-{meeting.id}"
    try:
        container = client.containers.get(container_name)
        if container.status == "running":
            return "recording"
        elif container.status == "exited":
            # Check for transcript
            transcript_path = f"/data/{meeting.meeting_id}_transcript.json"
            status_path = f"/data/{meeting.meeting_id}_status.json"
            
            if os.path.exists(status_path):
                with open(status_path, 'r') as f:
                    status_data = json.load(f)
                    if status_data.get("status") == "completed" and os.path.exists(transcript_path):
                        with open(transcript_path, 'r') as tf:
                            transcript_json = json.load(tf)
                            segments = transcript_json.get("segments", [])
                            full_text = " ".join([s["text"] for s in segments])
                            
                            transcript = models.Transcript(
                                meeting_id=meeting.id,
                                segments=segments,
                                full_text=full_text,
                                whisper_model="zoom-captions"
                            )
                            db.add(transcript)
                            meeting.status = "completed"
                            db.commit()
                    else:
                        meeting.status = "failed"
                        meeting.error_message = status_data.get("error", "Unknown error")
                        db.commit()
            else:
                meeting.status = "failed"
                meeting.error_message = container.logs().decode("utf-8")
                db.commit()
            
            container.remove()
            return meeting.status
    except docker.errors.NotFound:
        # Container doesn't exist anymore
        if meeting.status in ["joining", "recording", "transcribing"]:
            meeting.status = "failed"
            meeting.error_message = "Container disappeared"
            db.commit()
            return "failed"
    return meeting.status
