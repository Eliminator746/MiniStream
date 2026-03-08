/**
 * @file types.ts
 * @description Centralized types for video streaming application
 */

// ============================================================================
// AUTH TYPES
// ============================================================================

export interface AuthState {
  user: string | null;
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

export interface AuthResponse {
  message: string;
  user?: string;
  token?: string;
  user_id?: number;
}

// ============================================================================
// VIDEO TYPES
// ============================================================================

export interface Video {
  id: number;
  title: string;
  description: string;
  filename: string;
  likes: number;
  uploader: string;
}

export interface VideoDetail extends Video {
  uploader_id?: number;
}

export interface VideoUploadRequest {
  title: string;
  description: string;
  file: File;
}

// ============================================================================
// COMMENT TYPES
// ============================================================================

export interface Comment {
  id: number;
  user: string;
  content: string;
  timestamp: string;
  video_id?: number;
}

export interface CommentCreateRequest {
  content: string;
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
// API ERROR TYPES
// ============================================================================

export interface ApiErrorResponse {
  detail?: string;
  message?: string;
  [key: string]: any;
}
