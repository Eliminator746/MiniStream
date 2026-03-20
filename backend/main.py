from pathlib import Path
import tempfile

from dotenv import load_dotenv
from fastapi import FastAPI, Form, File, UploadFile, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse


from auth import router as auth_router
from auth import get_current_user

from models import User, Video, Comment, Like
from database import engine
from sqlalchemy.orm import Session, joinedload
from database import Base, engine, get_db

import os, uuid, hashlib, time
import subprocess
from functools import lru_cache
import boto3
from loguru import logger
import magic


logger.info("Imports working correctly")
load_dotenv(Path(__file__).parent.parent / ".env")



AWS_BUCKET = 'ministream-bucket'
VIDEO_PREFIX = "videos/"
THUMBNAIL_PREFIX = "thumbnails/"

s3_client = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_DEFAULT_REGION")
)

KB = 1024
MB = 1024 * KB

SUPPORTED_VIDEO_TYPES = {
    "video/mp4": "mp4"
}

SUPPORTED_IMAGE_TYPES = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
}
MAX_IMAGE_SIZE = 5 * MB

TEMP_DIR = str(Path(__file__).parent / "temp")
os.makedirs(TEMP_DIR, exist_ok=True)


# ----------------------------
# S3 Upload Helper
# ----------------------------

async def s3_upload(contents: bytes, key: str, content_type: str):
    logger.info(f"Uploading {key} to S3")

    s3_client.put_object(
        Bucket=AWS_BUCKET,
        Key=key,
        Body=contents,
        ContentType=content_type
    )

# ----------------------------
# Image Upload Helper
# ----------------------------

def upload_user_image(contents: bytes, folder: str) -> str:
    if len(contents) > MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="Image must be under 5 MB")

    mime = magic.from_buffer(contents, mime=True)
    if mime not in SUPPORTED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {mime}")

    ext = SUPPORTED_IMAGE_TYPES[mime]
    key = f"{folder}/{uuid.uuid4()}.{ext}"

    s3_client.put_object(Bucket=AWS_BUCKET, Key=key, Body=contents, ContentType=mime)
    return key


# ----------------------------
# S3 ETag (MD5) Fetcher
# ----------------------------

def get_s3_hash(key: str) -> str | None:
    try:
        head = s3_client.head_object(Bucket=AWS_BUCKET, Key=key)
        return head["ETag"].strip('"')
    except Exception:
        return None



# ----------------------------
# Thumbnail Generator
# ----------------------------

def generate_thumbnail(video_path: str, thumbnail_path: str):
    subprocess.run(
        [
            "ffmpeg",
            "-i", video_path, # input video file
            "-ss", "00:00:01", # 1sec frame it took
            "-vframes", "1",
            "-y",
            thumbnail_path  # Output file path
        ],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True
    )

# Give me a temporary, secure URL to access a private S3 object
# Frontend → Your API → returns presigned URL → Frontend loads image directly from S3
# Cached for 30 min so the same URL is returned → browser can HTTP-cache the image
@lru_cache(maxsize=512)
def _presigned_url(key: str, _bucket: int) -> str:
    return s3_client.generate_presigned_url(
        "get_object",
        Params={
            "Bucket": AWS_BUCKET,
            "Key": key,
            "ResponseCacheControl": "public, max-age=86400",
        },
        ExpiresIn=3600,
    )

def generate_presigned_url(key: str) -> str:
    return _presigned_url(key, int(time.time()) // 1800)


Base.metadata.create_all(bind=engine)

# ----------------------------
# App & Middleware
# ----------------------------
app = FastAPI()
app.include_router(auth_router)


app.add_middleware(
    CORSMiddleware, 
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

      


@app.post("/upload")
async def upload_video(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),   # ✅ JWT user
    db: Session = Depends(get_db)
):

    contents = await file.read() # in bytes it returns
    size = len(contents)

    if not 0 < size <= 5 * MB:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Supported file size is 0 - 5 MB"
        )

    file_type = magic.from_buffer(contents, mime=True)

    if file_type not in SUPPORTED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type: {file_type}"
        )

    video_id = str(uuid.uuid4())
    video_ext = SUPPORTED_VIDEO_TYPES[file_type]

    video_key = f"{VIDEO_PREFIX}{video_id}.{video_ext}"
    temp_video_path = f"{TEMP_DIR}/{video_id}.{video_ext}"
    thumbnail_name = f"{video_id}.jpg"
    # with this — works on both Windows and Linux
    temp_thumbnail_path = os.path.join(tempfile.gettempdir(), thumbnail_name)
    thumbnail_key = f"{THUMBNAIL_PREFIX}{thumbnail_name}"

    try:
        # Save temp video locally (needed for ffmpeg)
        with open(temp_video_path, "wb") as f:
            f.write(contents)

        # ----------------------------
        # Generate Thumbnail
        # ----------------------------

        generate_thumbnail(temp_video_path, temp_thumbnail_path)
        
        # ----------------------------
        # Upload Video to S3
        # ----------------------------

        await s3_upload(contents, video_key, file_type)

        # ----------------------------
        # Upload Thumbnail to S3
        # ----------------------------

        with open(temp_thumbnail_path, "rb") as f:
            thumbnail_bytes = f.read()

        await s3_upload(thumbnail_bytes, thumbnail_key, "image/jpeg")
    
    finally:
        # ----------------------------
        # Remove temp files - Always runs — even if an exception occurred above
        # ----------------------------

        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)

        if os.path.exists(temp_thumbnail_path):
            os.remove(temp_thumbnail_path)

    # ----------------------------
    # Save DB record
    # ----------------------------

    new_video = Video(
        title=title,
        description=description,
        video_key=video_key,
        thumbnail_key=thumbnail_key,
        uploader_id=user.id
    )

    db.add(new_video)
    db.commit()
    db.refresh(new_video)

    return {
        "message": "Video uploaded successfully",
        "video_id": new_video.id,
        "video_key": video_key,
        "thumbnail_key": thumbnail_key
    }
    
@app.get("/videos")
async def get_videos(
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=50),
    db: Session = Depends(get_db)
):
    total = db.query(Video).count()
    offset = (page - 1) * limit
    videos = db.query(Video).options(joinedload(Video.uploader)).offset(offset).limit(limit).all()

    return {
        "videos": [
            {
                "id": video.id,
                "title": video.title,
                "description": video.description,
                "thumbnail": generate_presigned_url(video.thumbnail_key),
                "likes": video.likes,
                "uploader": video.uploader.name
            }
            for video in videos
        ],
        "page": page,
        "total": total,
        "has_more": offset + len(videos) < total
    }
# Why video is not returned here?
# Bec it'll contain data about video and not video, once user clicks on video (i.e page), then it will be redirected and video will play


# Give video metadata
# moved ABOVE /video/{video_id} to prevent route conflict
@app.get("/video/metadata/{video_id}")
async def get_video_details(
    video_id: int,
    db: Session = Depends(get_db)
):
    video = db.query(Video).options(joinedload(Video.uploader)).filter(Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    comments_count = db.query(Comment).filter(Comment.video_id == video_id).count()

    return {
        "id": video.id,
        "title": video.title,
        "description": video.description,
        "thumbnail": generate_presigned_url(video.thumbnail_key),
        "likes": video.likes,
        "comments_count": comments_count,
        "uploader": {
            "id": video.uploader.id,
            "name": video.uploader.name
        }
    }
    
    
# Returns the full video file
@app.get("/video/{video_id}")
async def stream_video(
    video_id: int,
    db: Session = Depends(get_db)
):

    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    return {"video_url": generate_presigned_url(video.video_key)}



# User's uploaded videos API (for profile page)
@app.get("/user/videos/{user_id}")
async def get_user_videos(
    user_id: int,
    db: Session = Depends(get_db)
):

    videos = db.query(Video).filter(Video.uploader_id == user_id).all()

    return [
        {
            "id": video.id,
            "title": video.title,
            "thumbnail": generate_presigned_url(video.thumbnail_key),
            "likes": video.likes
        }
        for video in videos
    ]

    
# Get metadata for userprofile
@app.get("/profile/{user_id}")
def get_profile(user_id: int, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile_image_url = (
        generate_presigned_url(user.profile_image)
        if user.profile_image else None
    )

    cover_image_url = (
        generate_presigned_url(user.cover_image)
        if user.cover_image else None
    )

    return {
        "id": user.id,
        "username": user.name,
        "about": user.about,
        "profile_image": profile_image_url,
        "cover_image": cover_image_url,
        "subscribers": user.subscribers
    }

# Update profile for userprofile
@app.put("/profile")
def update_profile(
    user: User = Depends(get_current_user),   # ✅ JWT user
    username: str = Form(...),
    about: str = Form(""),
    db: Session = Depends(get_db)
):


    user.name = username
    user.about = about

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated",
        "username": user.name,
        "about": user.about
    }


# Update profile image for userprofile
@app.post("/profile/image")
async def upload_profile_image(
    user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    new_hash = hashlib.md5(contents).hexdigest()

    # prevent uploading same image that's already set as profile
    if user.profile_image and get_s3_hash(user.profile_image) == new_hash:
        raise HTTPException(status_code=400, detail="This image is already your profile picture")

    if user.profile_image:
        s3_client.delete_object(Bucket=AWS_BUCKET, Key=user.profile_image)

    key = upload_user_image(contents, "profile-images")
    user.profile_image = key
    db.commit()
    return {"message": "Profile image updated", "profile_image": key}

# Update cover image for userprofile
@app.post("/profile/cover")
async def upload_cover_image(
    user: User = Depends(get_current_user),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    contents = await file.read()
    new_hash = hashlib.md5(contents).hexdigest()

    # prevent uploading same image that's already set as cover
    if user.cover_image and get_s3_hash(user.cover_image) == new_hash:
        raise HTTPException(status_code=400, detail="This image is already your cover picture")

    if user.cover_image:
        s3_client.delete_object(Bucket=AWS_BUCKET, Key=user.cover_image)

    key = upload_user_image(contents, "cover-images")
    user.cover_image = key
    db.commit()
    return {"message": "Cover image updated", "cover_image": key}

# Likes the video if not liked by this user else unlikes it
@app.post("/like/{video_id}")
async def like_video(
    video_id: int,
    user: User = Depends(get_current_user),   # ✅ JWT user
    db: Session = Depends(get_db)
):
    
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
    user: User = Depends(get_current_user),   # ✅ JWT user
    db: Session = Depends(get_db)
):

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
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit

    comments = (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.video_id == video_id)
        .order_by(Comment.timestamp.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    total = db.query(Comment).filter(Comment.video_id == video_id).count()

    return {
        "comments": [
            {
                "id": comment.id,
                "user": comment.user.name,
                "content": comment.content,
                "timestamp": comment.timestamp
            }
            for comment in comments
        ],
        "page": page,
        "total": total
    }


# Add comment by this user
@app.post("/comment/{video_id}")
async def add_comment(
    video_id: int,
    content: str = Form(..., min_length=1),   # validation replaces manual if-not check
    user: User = Depends(get_current_user),   # ✅ JWT user
    db: Session = Depends(get_db)
):

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


#Edit comment by the owner
@app.put("/comment/{comment_id}")
async def edit_comment(
    comment_id: int,
    content: str = Form(..., min_length=1),
    user: User = Depends(get_current_user),   # ✅ JWT user
    db: Session = Depends(get_db)
):

    comment = db.query(Comment).filter(Comment.id == comment_id).first()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    comment.content = content
    db.commit()
    db.refresh(comment)

    return {
        "message": "Comment updated",
        "comment": {
            "id": comment.id,
            "content": comment.content,
            "timestamp": comment.timestamp
        }
    }
    
    
# Delete comment by the owner
@app.delete("/comment/{comment_id}")
async def delete_comment(
    comment_id: int,
    user: User = Depends(get_current_user),   # ✅ JWT user
    db: Session = Depends(get_db)
):

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
    user: User = Depends(get_current_user),   # ✅ JWT user
    db: Session = Depends(get_db)
):

    video = db.query(Video).filter(Video.id == video_id).first()

    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    # Only uploader can delete
    if video.uploader_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this video"
        )

    try:
        s3_client.delete_object(Bucket=AWS_BUCKET, Key=video.video_key)
        s3_client.delete_object(Bucket=AWS_BUCKET, Key=video.thumbnail_key)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file from S3: {str(e)}")

    # delete DB record
    db.delete(video)
    db.commit()

    return {"message": "Video deleted successfully"}


# ─────────────────────────────────────────────────────────────────────────────
# Serve React SPA — MUST be LAST so API routes are matched first
# ─────────────────────────────────────────────────────────────────────────────

DIST_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if DIST_DIR.exists():
    app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_spa(full_path: str):
    """Return index.html for all non-API routes so React Router works."""
    index = DIST_DIR / "index.html"
    if index.exists():
        return FileResponse(str(index))
    return {"detail": "Frontend not built. Run: cd frontend && npm run build"}