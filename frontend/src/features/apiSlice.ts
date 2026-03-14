import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Video,
  Comment,
  LikeResponse,
  LikeCheckResponse,
  VideoMetadata,
  UserVideo,
  CommentsResponse,
  CommentEditResponse,
} from "./types";
import type { RootState } from "@/store/store";
import { setCredentials, logout as logoutAction } from "./authSlice";

const BASE_URL = "http://localhost:8000";

// Helper: build FormData for file uploads
const buildFormData = (data: Record<string, any>) => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (value instanceof File) {
      formData.append(key, value);
    } else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  return formData;
};

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const token = state.auth.token;

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Video", "Comment", "Like"],
  endpoints: (builder) => ({
    // ======================================================
    // AUTH ENDPOINTS
    // ======================================================

    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (body) => ({
        url: "/register",
        method: "POST",
        body,
      }),
    }),

    login: builder.mutation<
      { message: string; user: string; token: string },
      LoginRequest
    >({
      query: (credentials) => ({
        url: "/login",
        method: "POST",
        body: new URLSearchParams({
          email: credentials.email,
          password: credentials.password,
        }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
    }),

    // ======================================================
    // VIDEO ENDPOINTS
    // ======================================================

    getVideos: builder.query<Video[], void>({
      query: () => ({
        url: "/videos",
        method: "GET",
      }),
      providesTags: ["Video"],
    }),

    uploadVideo: builder.mutation<
      { message: string; video_id: number; filename: string },
      { title: string; description: string; file: File; token: string }
    >({
      query: ({ title, description, file, token }) =>
        ({
          url: "/upload",
          method: "POST",
          body: buildFormData({
            title,
            description,
            file,
            token,
          }),
        }) as any,
      invalidatesTags: ["Video"],
    }),

    streamVideo: builder.query<Blob, number>({
      query: (videoId) => ({
        url: `/video/${videoId}`,
        method: "GET",
        responseHandler: (response) => response.blob(),
      }),
    }),

    getVideoMetadata: builder.query<VideoMetadata, number>({
      query: (videoId) => ({
        url: `/video/metadata/${videoId}`,
        method: "GET",
      }),
      providesTags: (result, error, videoId) => [
        { type: "Video", id: videoId },
      ],
    }),

    getUserVideos: builder.query<UserVideo[], number>({
      query: (userId) => ({
        url: `/user/videos/${userId}`,
        method: "GET",
      }),
      providesTags: ["Video"],
    }),

    deleteVideo: builder.mutation<
      { message: string },
      { videoId: number; token: string }
    >({
      query: ({ videoId, token }) => ({
        url: `/video/${videoId}`,
        method: "DELETE",
        body: new URLSearchParams({ token }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
      invalidatesTags: ["Video"],
    }),

    // ======================================================
    // LIKE ENDPOINTS
    // ======================================================

    likeVideo: builder.mutation<
      LikeResponse,
      { videoId: number; token: string }
    >({
      query: ({ videoId, token }) => ({
        url: `/like/${videoId}`,
        method: "POST",
        body: new URLSearchParams({ token }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
      // refetch video metadata after like
      invalidatesTags: (result, error, { videoId }) => [
        { type: "Video", id: videoId },
      ],
    }),

    checkLiked: builder.query<
      LikeCheckResponse,
      { videoId: number; token: string }
    >({
      query: ({ videoId, token }) => ({
        url: `/liked/${videoId}`,
        method: "GET",
        params: { token },
      }),
      providesTags: ["Like"],
    }),

    // ======================================================
    // COMMENT ENDPOINTS
    // ======================================================

    getComments: builder.query<
      CommentsResponse,
      { videoId: number; page?: number; limit?: number }
    >({
      query: ({ videoId, page = 1, limit = 10 }) => ({
        url: `/comments/${videoId}`,
        method: "GET",
        params: { page, limit },
      }),
      providesTags: ["Comment"],
    }),

    addComment: builder.mutation<
      {
        message: string;
        comment: Comment;
      },
      { videoId: number; content: string; token: string }
    >({
      query: ({ videoId, content, token }) => ({
        url: `/comment/${videoId}`,
        method: "POST",
        body: new URLSearchParams({ content, token }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
      invalidatesTags: ["Comment"],
    }),

    editComment: builder.mutation<
      CommentEditResponse,
      { commentId: number; content: string; token: string }
    >({
      query: ({ commentId, content, token }) => ({
        url: `/comment/${commentId}`,
        method: "PUT",
        body: new URLSearchParams({ content, token }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
      invalidatesTags: ["Comment"],
    }),

    deleteComment: builder.mutation<
      { message: string },
      { commentId: number; token: string }
    >({
      query: ({ commentId, token }) => ({
        url: `/comment/${commentId}`,
        method: "DELETE",
        body: new URLSearchParams({ token }),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }),
      invalidatesTags: ["Comment"],
    }),
  }),
});

export const {
  // Auth
  useRegisterMutation,
  useLoginMutation,

  // Videos
  useGetVideosQuery,
  useUploadVideoMutation,
  useStreamVideoQuery,
  useGetVideoMetadataQuery,
  useGetUserVideosQuery,
  useDeleteVideoMutation,

  // Likes
  useLikeVideoMutation,
  useCheckLikedQuery,

  // Comments
  useGetCommentsQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
} = apiSlice;
