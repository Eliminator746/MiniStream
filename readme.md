# Ministream 🎬

A full-stack video streaming platform built with **FastAPI**, **React**, **AWS Cognito**, and **AWS S3**. Users sign in via Cognito Hosted UI, upload videos, like, comment, and manage their profiles.

**Live:** https://ministream.onrender.com

---

## Tech Stack

### Backend

| Layer                | Technology                                         |
| -------------------- | -------------------------------------------------- |
| Framework            | FastAPI                                            |
| Database             | SQLite / PostgreSQL + SQLAlchemy                   |
| File Storage         | AWS S3 (presigned URLs)                            |
| Auth                 | AWS Cognito + python-jose (RS256 JWT verification) |
| Thumbnail Generation | ffmpeg                                             |
| MIME Detection       | python-magic                                       |
| Env Management       | python-dotenv                                      |
| Logging              | loguru                                             |

### Frontend

| Layer    | Technology                       |
| -------- | -------------------------------- |
| UI       | React 19 + TypeScript            |
| Build    | Vite                             |
| Auth SDK | aws-amplify v6 (OAuth PKCE flow) |
| State    | Redux Toolkit + RTK Query        |
| Routing  | React Router v7                  |
| Styling  | Tailwind CSS v4                  |

---

## Project Structure

```
Ministream/
├── backend/
│   ├── main.py          # FastAPI app, all API routes, serves React SPA
│   ├── auth.py          # Cognito JWT verification, /auth/me, user auto-provisioning
│   ├── models.py        # SQLAlchemy models
│   ├── database.py      # DB engine, session, Base
│   └── temp/            # Temporary video files (auto-created)
├── frontend/
│   ├── src/
│   │   ├── config/amplifyConfig.ts   # Amplify Cognito setup
│   │   ├── features/authSession.ts   # Shared token retrieval helper
│   │   ├── features/apiSlice.ts      # RTK Query API definitions
│   │   ├── features/authSlice.ts     # Redux auth state + localStorage
│   │   ├── hooks/useAuth.ts          # Session bootstrap + signOut
│   │   ├── screens/AuthCallback.tsx  # OAuth callback handler
│   │   └── screens/...              # Home, VideoPlayer, Profile, Upload, Login, Register
│   └── package.json
├── build.sh             # Render build script
├── requirements.txt     # Python dependencies
├── .env                 # Local env variables (never commit)
```

---

## Authentication — AWS Cognito

Ministream uses **AWS Cognito Hosted UI** with **OAuth 2.0 Authorization Code (PKCE)** flow. No passwords are stored in the backend.

### How it works

```
1. User clicks "Sign In"
       ↓
2. Frontend calls Amplify signInWithRedirect()
       ↓
3. Browser redirects to Cognito Hosted UI
       ↓
4. User signs in / signs up on Cognito
       ↓
5. Cognito redirects back to /auth/callback?code=<authorization_code>
       ↓
6. Amplify OAuth listener exchanges code for tokens (PKCE)
       ↓
7. Frontend reads idToken from Amplify session
       ↓
8. Frontend calls GET /auth/me with Bearer <idToken>
       ↓
9. Backend verifies JWT against Cognito JWKS (RS256)
       ↓
10. If user doesn't exist in DB → auto-provisioned
       ↓
11. User object returned → stored in Redux → app is ready
```

### AWS Cognito Setup

1. Go to **AWS Console → Cognito → Create User Pool**
2. Choose **Email** as sign-in option
3. Under **App Integration**, create an App Client:
   - Select **Public client** (no client secret)
   - Set **Allowed callback URLs**:
     - `http://localhost:5173/auth/callback` (local dev)
     - `https://ministream.onrender.com/auth/callback` (production)
   - Set **Allowed sign-out URLs**:
     - `http://localhost:5173/` (local dev)
     - `https://ministream.onrender.com/` (production)
   - Enable **Authorization code grant** with scopes: `openid`, `email`, `profile`
4. Under **Domain**, configure a Cognito domain (e.g. `ap-south-1xxxxx.auth.ap-south-1.amazoncognito.com`)
5. Note down: **User Pool ID**, **App Client ID**, **Cognito Domain**

### Backend Token Verification

The backend never talks to Cognito during login. It only:

- Fetches Cognito's **JWKS** (public keys) once and caches them
- Verifies incoming JWT `idToken` using RS256 against those public keys
- Extracts `email` and `name` from the token payload
- Auto-creates the user in DB on first login

### Key Environment Variables for Cognito

**Backend (runtime — set in Render env vars):**

| Variable                | Description                                     |
| ----------------------- | ----------------------------------------------- |
| `COGNITO_USER_POOL_ID`  | e.g. `ap-south-1_PELK9Za3H`                     |
| `COGNITO_APP_CLIENT_ID` | e.g. `52jca2jk0fd7bjl2u85b7sbfni`               |
| `COGNITO_REGION`        | e.g. `ap-south-1` (or use `AWS_DEFAULT_REGION`) |

**Frontend (build-time — set in `.env.production`):**

| Variable                         | Description                                          |
| -------------------------------- | ---------------------------------------------------- |
| `VITE_COGNITO_USER_POOL_ID`      | Same user pool ID                                    |
| `VITE_COGNITO_APP_CLIENT_ID`     | Same app client ID                                   |
| `VITE_COGNITO_DOMAIN`            | Cognito Hosted UI domain (without `https://`)        |
| `VITE_COGNITO_REDIRECT_SIGN_IN`  | e.g. `https://ministream.onrender.com/auth/callback` |
| `VITE_COGNITO_REDIRECT_SIGN_OUT` | e.g. `https://ministream.onrender.com/`              |
| `VITE_API_URL`                   | e.g. `https://ministream.onrender.com`               |

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

### 3. Install backend dependencies

```bash
pip install -r requirements.txt
```

### 4. Install frontend dependencies

```bash
cd frontend
npm install
```

### 5. Install ffmpeg

**Windows** — download from https://ffmpeg.org/download.html and add to system PATH

**Linux**

```bash
sudo apt install ffmpeg
```

**Mac**

```bash
brew install ffmpeg
```

### 6. Create `.env` file

Create a `.env` file in the root of the project (one level above `backend/`):

```env
DATABASE_URL=sqlite:///./ministream.db
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=ap-south-1
COGNITO_USER_POOL_ID=your-user-pool-id
COGNITO_APP_CLIENT_ID=your-app-client-id
COGNITO_REGION=ap-south-1
```

### 7. Create frontend `.env` file

Create `frontend/.env` for local development:

```env
VITE_API_URL=http://localhost:8000
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_APP_CLIENT_ID=your-app-client-id
VITE_COGNITO_DOMAIN=your-cognito-domain.auth.ap-south-1.amazoncognito.com
VITE_COGNITO_REDIRECT_SIGN_IN=http://localhost:5173/auth/callback
VITE_COGNITO_REDIRECT_SIGN_OUT=http://localhost:5173/
```

### 8. Run the backend

```bash
cd backend
uvicorn main:app --reload
```

Server runs at `http://localhost:8000`
Swagger UI available at `http://localhost:8000/docs`

### 9. Run the frontend

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## Deployment (Render)

The app is deployed as a **single Render Web Service**. FastAPI serves both the API and the React SPA from `frontend/dist`.

### Build command

```bash
./build.sh
```

This script:

1. Installs system dependency `libmagic1`
2. Installs Python dependencies from `requirements.txt`
3. Copies `/etc/secrets/.env.production` into `frontend/.env.production`
4. Installs Node dependencies and builds the Vite production bundle

### Start command

```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Required Render environment variables

| Variable                | Where    | Description               |
| ----------------------- | -------- | ------------------------- |
| `AWS_ACCESS_KEY_ID`     | Env vars | AWS IAM access key        |
| `AWS_SECRET_ACCESS_KEY` | Env vars | AWS IAM secret key        |
| `AWS_DEFAULT_REGION`    | Env vars | e.g. `ap-south-1`         |
| `COGNITO_USER_POOL_ID`  | Env vars | Cognito User Pool ID      |
| `COGNITO_APP_CLIENT_ID` | Env vars | Cognito App Client ID     |
| `COGNITO_REGION`        | Env vars | e.g. `ap-south-1`         |
| `DATABASE_URL`          | Env vars | PostgreSQL URL (if using) |

Frontend build-time variables (`VITE_*`) go in a **Render Secret File** at `/etc/secrets/.env.production`.

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

| Method | URL        | Auth | Description                           |
| ------ | ---------- | ---- | ------------------------------------- |
| GET    | `/auth/me` | Yes  | Get current user from Cognito idToken |

> All protected routes require the header:
> `Authorization: Bearer <cognito_id_token>`

The frontend obtains the token from **Amplify session** after OAuth callback.

---

### Videos

| Method | URL                          | Auth | Description               |
| ------ | ---------------------------- | ---- | ------------------------- |
| POST   | `/upload`                    | Yes  | Upload a video            |
| GET    | `/videos`                    | No   | Get paginated videos      |
| GET    | `/video/metadata/{video_id}` | No   | Get video metadata        |
| GET    | `/stream/{video_id}`         | No   | Get presigned video URL   |
| DELETE | `/video/{video_id}`          | Yes  | Delete video (owner only) |

> **Note:** Video streaming uses `/stream/{video_id}`, not `/video/{video_id}`.
> The `/video/:id` path is reserved for the frontend page route.

**Upload fields** — `form-data`:

```
title        string     required
description  string     required
file         .mp4 file  required (max 5 MB)
```

---

### Profile

| Method | URL                       | Auth | Description            |
| ------ | ------------------------- | ---- | ---------------------- |
| GET    | `/profile-data/{user_id}` | No   | Get user profile       |
| PUT    | `/profile`                | Yes  | Update name and about  |
| GET    | `/user/videos/{user_id}`  | No   | Get all videos by user |
| POST   | `/profile/image`          | Yes  | Upload profile image   |
| POST   | `/profile/cover`          | Yes  | Upload cover image     |

> **Note:** Profile data uses `/profile-data/{user_id}`, not `/profile/{user_id}`.
> The `/profile/:userId` path is reserved for the frontend page route.

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

## SPA Route vs API Route — Important Convention

FastAPI serves the React SPA for all routes not matched by an API endpoint. This means:

- **Frontend page routes** (`/video/:id`, `/profile/:userId`) must **not** collide with **backend GET API routes**.
- If they share the same path, browser refresh sends a GET to the server → API returns JSON instead of `index.html`.

**Current non-colliding paths:**

| Frontend Page      | API Endpoint (GET)        |
| ------------------ | ------------------------- |
| `/video/:id`       | `/stream/{video_id}`      |
| `/profile/:userId` | `/profile-data/{user_id}` |

> Only GET collisions matter. POST/PUT/DELETE on the same path are safe because browser refresh always sends GET.

---

## Database Models

```
User
├── id, name, email, password (nullable for Cognito users)
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
  Frontend uses the URL directly (valid for 1 hour, cached 30 min)
```

---

## All Environment Variables Reference

### Backend (runtime)

| Variable                | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `DATABASE_URL`          | SQLAlchemy DB URL e.g. `sqlite:///./ministream.db`  |
| `AWS_ACCESS_KEY_ID`     | AWS IAM access key                                  |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM secret key                                  |
| `AWS_DEFAULT_REGION`    | AWS region e.g. `ap-south-1`                        |
| `COGNITO_USER_POOL_ID`  | Cognito User Pool ID                                |
| `COGNITO_APP_CLIENT_ID` | Cognito App Client ID                               |
| `COGNITO_REGION`        | Cognito region (falls back to `AWS_DEFAULT_REGION`) |

### Frontend (build-time, `VITE_` prefix)

| Variable                         | Description              |
| -------------------------------- | ------------------------ |
| `VITE_API_URL`                   | Backend base URL         |
| `VITE_COGNITO_USER_POOL_ID`      | Cognito User Pool ID     |
| `VITE_COGNITO_APP_CLIENT_ID`     | Cognito App Client ID    |
| `VITE_COGNITO_DOMAIN`            | Cognito Hosted UI domain |
| `VITE_COGNITO_REDIRECT_SIGN_IN`  | OAuth callback URL       |
| `VITE_COGNITO_REDIRECT_SIGN_OUT` | Post-logout redirect URL |

---
