# Ministream 🎬

A video streaming backend built with FastAPI, SQLite, and AWS S3. Users can register, upload videos, like, comment, and manage their profiles.

---

## Tech Stack

| Layer                | Technology                           |
| -------------------- | ------------------------------------ |
| Framework            | FastAPI                              |
| Database             | SQLite + SQLAlchemy                  |
| File Storage         | AWS S3                               |
| Auth                 | JWT (python-jose) + bcrypt (passlib) |
| Thumbnail Generation | ffmpeg                               |
| MIME Detection       | python-magic                         |
| Env Management       | python-dotenv                        |
| Logging              | loguru                               |

---

## Project Structure

```
Ministream/
├── backend/
│   ├── main.py          # App entry point, all routes
│   ├── auth.py          # Register, login, JWT logic
│   ├── models.py        # SQLAlchemy models
│   ├── database.py      # DB engine, session, Base
│   └── temp/            # Temporary video files (auto-created)
├── .env                 # Environment variables (never commit)
└── README.md
```

---

## Setup & Installation

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ministream.git
cd ministream
```

### 2. Create and activate virtual environment

```bash
python -m venv .venv

# Windows
.venv\Scripts\activate

# Linux / Mac
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install fastapi uvicorn sqlalchemy python-jose passlib bcrypt python-dotenv boto3 python-magic loguru python-multipart
```

### 4. Install ffmpeg

**Windows** — download from https://ffmpeg.org/download.html and add to system PATH

**Linux**

```bash
sudo apt install ffmpeg
```

**Mac**

```bash
brew install ffmpeg
```

### 5. Create `.env` file

Create a `.env` file in the root of the project (one level above `backend/`):

```env
DATABASE_URL=sqlite:///./ministream.db
SECRET_KEY=your-secret-key-here
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=ap-south-1
```

### 6. Run the server

```bash
cd backend
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`
Swagger UI available at `http://localhost:8000/docs`

---

## AWS S3 Setup

1. Go to **AWS Console → S3 → Create Bucket**
2. Name it `ministream-bucket`, select region `ap-south-1` (Mumbai)
3. Go to **IAM → Users → Create User**
4. Attach **AmazonS3FullAccess** policy
5. Create an access key and copy the credentials to `.env`

---

## API Reference

### Auth

| Method | URL              | Auth | Description              |
| ------ | ---------------- | ---- | ------------------------ |
| POST   | `/auth/register` | No   | Register new user        |
| POST   | `/auth/login`    | No   | Login, returns JWT token |

**Register fields** — `form-data`:

```
name      string   required
email     string   required (valid email)
password  string   required (min 8 chars)
```

**Login fields** — `form-data`:

```
email     string   required
password  string   required
```

**Login response:**

```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer"
}
```

> All protected routes require the header:
> `Authorization: Bearer <access_token>`

---

### Videos

| Method | URL                          | Auth | Description               |
| ------ | ---------------------------- | ---- | ------------------------- |
| POST   | `/upload`                    | Yes  | Upload a video            |
| GET    | `/videos`                    | No   | Get latest 15 videos      |
| GET    | `/video/metadata/{video_id}` | No   | Get video metadata        |
| GET    | `/video/{video_id}`          | No   | Get presigned video URL   |
| DELETE | `/video/{video_id}`          | Yes  | Delete video (owner only) |

**Upload fields** — `form-data`:

```
title        string     required
description  string     required
file         .mp4 file  required (max 200 MB)
```

---

### Profile

| Method | URL                      | Auth | Description            |
| ------ | ------------------------ | ---- | ---------------------- |
| GET    | `/profile/{user_id}`     | No   | Get user profile       |
| PUT    | `/profile`               | Yes  | Update name and about  |
| GET    | `/user/videos/{user_id}` | No   | Get all videos by user |
| POST   | `/profile/image`         | Yes  | Upload profile image   |
| POST   | `/profile/cover`         | Yes  | Upload cover image     |

**Supported image types:** JPEG, PNG, WebP (max 5 MB)

> Uploading the same image that is already set will return a 400 error.

---

### Likes

| Method | URL                 | Auth | Description                             |
| ------ | ------------------- | ---- | --------------------------------------- |
| POST   | `/like/{video_id}`  | Yes  | Like or unlike a video (toggle)         |
| GET    | `/liked/{video_id}` | Yes  | Check if video is liked by current user |

---

### Comments

| Method | URL                     | Auth | Description                 |
| ------ | ----------------------- | ---- | --------------------------- |
| GET    | `/comments/{video_id}`  | No   | Get paginated comments      |
| POST   | `/comment/{video_id}`   | Yes  | Add a comment               |
| PUT    | `/comment/{comment_id}` | Yes  | Edit comment (owner only)   |
| DELETE | `/comment/{comment_id}` | Yes  | Delete comment (owner only) |

**Comment pagination query params:**

```
page   int   default: 1
limit  int   default: 10
```

---

## Database Models

```
User
├── id, name, email, password
├── profile_image, cover_image (S3 keys)
├── about, subscribers
└── videos → [Video]

Video
├── id, title, description
├── video_key, thumbnail_key (S3 keys)
├── likes, uploader_id
└── uploader → User

Like
├── id, user_id, video_id
└── unique constraint on (user_id, video_id)

Comment
├── id, user_id, video_id
├── content, timestamp
└── user → User
```

---

## How S3 Storage Works

Files are never stored in the database. Only the **S3 key** (file path) is saved.

```
Upload flow:
  User sends file → FastAPI receives bytes
       ↓
  Validate size + MIME type
       ↓
  Upload bytes to S3 with a UUID key
       ↓
  Save the key to DB

Retrieval flow:
  Frontend requests video/image
       ↓
  Backend generates a presigned URL from the key
       ↓
  Frontend uses the URL directly (valid for 1 hour)
```

---

## Environment Variables Reference

| Variable                | Description                                        |
| ----------------------- | -------------------------------------------------- |
| `DATABASE_URL`          | SQLAlchemy DB URL e.g. `sqlite:///./ministream.db` |
| `SECRET_KEY`            | JWT signing secret — keep this private             |
| `AWS_ACCESS_KEY_ID`     | AWS IAM access key                                 |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key                                 |
| `AWS_DEFAULT_REGION`    | AWS region e.g. `ap-south-1`                       |

---
