from fastapi import FastAPI, Form, File, UploadFile, Depends, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from werkzeug.security import generate_password_hash, check_password_hash
import os, shutil, datetime, uuid
from dotenv import load_dotenv
from pathlib import Path


load_dotenv(Path(__file__).parent.parent / ".env")
DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
Base = declarative_base()

# Set upload directory relative to backend folder
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    videos = relationship("Video", back_populates="uploader")

class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    filename = Column(String(255), nullable=False)
    likes = Column(Integer, default=0)

    uploader_id = Column(Integer, ForeignKey("users.id"))
    uploader = relationship("User", back_populates="videos")
    
class Like(Base):
    __tablename__ = "likes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    video_id = Column(Integer, ForeignKey("videos.id"))

    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User")
    # video = relationship("Video")

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
def get_user_by_token(token: str, db: Session):
    user = db.query(User).filter(User.name == token.split('_')[0]).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")

    return user

@app.post("/register")
async def register_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    # check if email already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # hash password
    hashed_password = generate_password_hash(password)

    # create user object
    new_user = User(
        name=name,
        email=email,
        password=hashed_password,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user_id": new_user.id
    }

@app.post("/login")
async def login_user(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    
    if not user or not check_password_hash(user.password, password):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    user.token = f"{user.name}_{uuid.uuid4()}"

    return {
        "message": "User logged in successfully",
        "user": user.name,
        "token": user.token
    }

@app.post("/upload")
async def upload_video(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    # get user from token
    user = get_user_by_token(token, db)

    # generate unique filename
    unique_name = f"{uuid.uuid4()}.{file.filename.split('.')[-1]}"
    file_path = os.path.join(UPLOAD_DIR, unique_name)

    # save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # create video record
    new_video = Video(
        title=title,
        description=description,
        filename=unique_name,
        uploader_id=user.id
    )

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    return {
        "message": "Video uploaded successfully",
        "video_id": new_video.id,
        "filename": unique_name
    }
    
@app.get("/videos")
async def get_videos(
    db: Session = Depends(get_db)
):
    videos = db.query(Video).all()
    
    # list comprehension below I've wrote
    return [
        {
            "title": video.title,
            "description": video.description,
            "filename": video.filename,
            "likes": video.likes,
            "uploader": video.uploader.name
        }
        for video in videos
    ]
# Why video is not returned here?
# Bec it'll contain data about video and not video, once user clicks on video (i.e page), then it will be redirected and video will play

# Returns the full video file
@app.get("/video/{video_id}")
async def stream_video(
    video_id: int,
    db: Session = Depends(get_db)
):
    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    file_path = os.path.join(UPLOAD_DIR, video.filename)
    
    return FileResponse(file_path, media_type="video/mp4")


# Likes the video if not liked by this user else unlikes it
@app.post("/like/{video_id}")
async def like_video(
    video_id: int,
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_user_by_token(token, db)
    if not user:
        raise HTTPException(status_code=404, detail="Invalid Token")
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    like = db.query(Like).filter(Like.user_id == user.id, Like.video_id == video.id).first()
    if like:
        # UNLIKE
        db.delete(like)
        video.likes = max(video.likes - 1, 0)
        liked = False
    else:
        # LIKE
        new_like = Like(
            user_id = user.id,
            video_id = video.id
        )
        
        video.likes += 1
        liked = True
        db.add(new_like)

    db.commit()
    if liked:
        db.refresh(new_like)
    
    return {
        "message": "Video liked",
        "likes": video.likes,
        "liked": liked
    }


# Checks if video is liked by this user or not
@app.get("/liked/{video_id}")
async def liked_video(
    video_id: int,
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_user_by_token(token, db)

    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    liked = db.query(Like).filter(
        Like.user_id == user.id,
        Like.video_id == video_id
    ).first()

    return {
        "liked": True if liked else False
    }

# Get all the comments for this video - PUBLIC
@app.get("/comments/{video_id}")
async def get_comments(
    video_id: int,
    db: Session = Depends(get_db)
):
    comments = db.query(Comment).filter(Comment.video_id == video_id).all()

    return [
        {
            "id": comment.id,
            "user": comment.user.name,
            "content": comment.content,
            "timestamp": comment.timestamp
        }
        for comment in comments
    ]

# Add comment by this user
@app.post("/comment/{video_id}")
async def add_comment(
    video_id: int,
    content: str = Form(...),
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_user_by_token(token, db)
    if not user:
        raise HTTPException(status_code=404, detail="Invalid Token")
    
    if not content:
        raise HTTPException(status_code=404, detail="Comment cannot be empty")

    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    new_comment = Comment(
        user_id=user.id,
        video_id=video_id,
        content=content
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return {
        "message": "Comment added",
        "comment": {
            "id": new_comment.id,
            "user": user.name,
            "content": new_comment.content,
            "timestamp": new_comment.timestamp
        }
    }


# Delete comment by the owner
@app.delete("/comment/{comment_id}")
async def delete_comment(
    comment_id: int,
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_user_by_token(token, db)

    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    db.delete(comment)
    db.commit()
    return {"message": "Comment deleted successfully"}


# Delete Video by the owner
@app.delete("/video/{video_id}")
async def delete_video(
    video_id: int,
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    user = get_user_by_token(token, db)

    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Only uploader can delete
    if video.uploader_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this video")

    # delete video file from uploads
    file_path = os.path.join(UPLOAD_DIR, video.filename)
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except FileNotFoundError:
        pass
    
    # delete record from DB
    db.delete(video)
    db.commit()

    return {"message": "Video deleted successfully"}
