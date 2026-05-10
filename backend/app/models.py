from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from .database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, nullable=False, index=True)
    meeting_url = Column(Text, nullable=False)
    meeting_id = Column(Text, nullable=False)
    meeting_pwd = Column(Text, nullable=True)
    meeting_name = Column(Text, default="Untitled Meeting")
    bot_name = Column(Text, default="Meno Bot")
    scheduled_at = Column(DateTime(timezone=True), nullable=False, index=True)
    status = Column(Text, default="scheduled")
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    transcript = relationship("Transcript", back_populates="meeting", uselist=False)

class Transcript(Base):
    __tablename__ = "transcripts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    meeting_id = Column(UUID(as_uuid=True), ForeignKey("meetings.id"), unique=True, nullable=False)
    segments = Column(JSONB, nullable=False)
    full_text = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    audio_duration_seconds = Column(Float, nullable=True)
    whisper_model = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meeting = relationship("Meeting", back_populates="transcript")
