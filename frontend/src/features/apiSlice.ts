import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Video,
  Comment,
  LikeResponse,
  LikeCheckResponse,
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

    deleteVideo: builder.mutation<
      { message: string },
      { videoId: number; token: string }
    >({
      query: ({ videoId, token }) => ({
        url: `/video/${videoId}`,
        method: "DELETE",
        body: { token },
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
        body: { token },
      }),
      invalidatesTags: ["Like"],
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

    getComments: builder.query<Comment[], number>({
      query: (videoId) => ({
        url: `/comments/${videoId}`,
        method: "GET",
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
        body: { content, token },
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
        body: { token },
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
  useDeleteVideoMutation,

  // Likes
  useLikeVideoMutation,
  useCheckLikedQuery,

  // Comments
  useGetCommentsQuery,
  useAddCommentMutation,
  useDeleteCommentMutation,
} = apiSlice;
