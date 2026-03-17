from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
import random
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)

    profile_image = Column(String(255), nullable=True)
    cover_image = Column(String(255), nullable=True)

    about = Column(Text, nullable=True)
    subscribers = Column(Integer, default=lambda: random.randint(50, 10000))

    videos = relationship("Video", back_populates="uploader")

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    video_key = Column(String(255), nullable=False)
    thumbnail_key = Column(String)
    likes = Column(Integer, default=0)

    uploader_id = Column(Integer, ForeignKey("users.id"))
    uploader = relationship("User", back_populates="videos")
    
class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))
    __table_args__ = (UniqueConstraint("user_id", "video_id", name="unique_user_video_like"),)

class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))

    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=lambda: datetime.now(datetime.timezone.utc))

    user = relationship("User")
    # video = relationship("Video")

