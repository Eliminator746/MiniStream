/**
 * @file types.ts
 * @description Centralized types for video streaming application
 */

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthUser {
  id: number;
  name: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterResponse {
  message: string;
  user_id: number;
}

// ============================================================================
// VIDEO TYPES
// ============================================================================

export interface Video {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  likes: number;
  uploader: string;
}

export interface VideosResponse {
  videos: Video[];
  page: number;
  total: number;
  has_more: boolean;
}

export interface VideoMetadata {
  id: number;
  title: string;
  description: string;
  thumbnail: string;
  likes: number;
  comments_count: number;
  uploader: {
    id: number;
    name: string;
  };
}

export interface UserVideo {
  id: number;
  title: string;
  thumbnail: string;
  likes: number;
}

export interface VideoStreamResponse {
  video_url: string;
}

// ============================================================================
// COMMENT TYPES
// ============================================================================

export interface Comment {
  id: number;
  user: string;
  content: string;
  timestamp: string;
}

export interface CommentEditResponse {
  message: string;
  comment: {
    id: number;
    content: string;
    timestamp: string;
  };
}

export interface CommentsResponse {
  comments: Comment[];
  page: number;
  total: number;
}

// ============================================================================
// LIKE TYPES
// ============================================================================

export interface LikeResponse {
  message: string;
  likes: number;
  liked: boolean;
}

export interface LikeCheckResponse {
  liked: boolean;
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface UserProfile {
  id: number;
  username: string;
  about: string | null;
  profile_image: string | null;
  cover_image: string | null;
  subscribers: number;
}
