from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models
from .bot_launcher import launch_bot, check_bot_status

scheduler = BackgroundScheduler()

def process_meetings():
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        
        # Check scheduled meetings
        upcoming_meetings = db.query(models.Meeting).filter(
            models.Meeting.status == 'scheduled',
            models.Meeting.scheduled_at <= now + timedelta(minutes=1)
        ).all()
        
        for meeting in upcoming_meetings:
            meeting.status = "joining"
            db.commit()
            launch_bot(meeting)
            
        # Check running bots
        running_meetings = db.query(models.Meeting).filter(
            models.Meeting.status.in_(['joining', 'recording', 'transcribing'])
        ).all()
        
        for meeting in running_meetings:
            new_status = check_bot_status(meeting, db)
            if new_status != meeting.status:
                meeting.status = new_status
                db.commit()
                
    except Exception as e:
        print(f"Scheduler error: {e}")
    finally:
        db.close()

def start_scheduler():
    scheduler.add_job(process_meetings, 'interval', seconds=30)
    scheduler.start()
