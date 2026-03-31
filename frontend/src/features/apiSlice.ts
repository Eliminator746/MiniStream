import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  Video,
  VideosResponse,
  Comment,
  LikeResponse,
  LikeCheckResponse,
  VideoMetadata,
  UserVideo,
  VideoStreamResponse,
  CommentsResponse,
  CommentEditResponse,
  UserProfile,
} from "./types";
import type { RootState } from "@/store/store";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

const baseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

// Helper to send form-urlencoded data (backend uses Form(...))
const formBody = (data: Record<string, string>) => ({
  body: new URLSearchParams(data),
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
});

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Video", "Comment", "Like", "Profile"],

  endpoints: (builder) => ({
    // ======================== VIDEOS ========================

    getVideos: builder.query<VideosResponse, { page?: number; limit?: number }>(
      {
        query: ({ page = 1, limit = 12 }) => ({
          url: "/videos",
          params: { page, limit },
        }),
        providesTags: ["Video"],
      },
    ),

    getVideoMetadata: builder.query<VideoMetadata, number>({
      query: (videoId) => `/video/metadata/${videoId}`,
      providesTags: (_r, _e, id) => [{ type: "Video", id }],
    }),

    streamVideo: builder.query<VideoStreamResponse, number>({
      query: (videoId) => `/stream/${videoId}`,
    }),

    uploadVideo: builder.mutation<
      {
        message: string;
        video_id: number;
        video_key: string;
        thumbnail_key: string;
      },
      { title: string; description: string; file: File }
    >({
      query: ({ title, description, file }) => {
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("file", file);
        return { url: "/upload", method: "POST", body: formData };
      },
      invalidatesTags: ["Video"],
    }),

    getUserVideos: builder.query<UserVideo[], number>({
      query: (userId) => `/user/videos/${userId}`,
      providesTags: ["Video"],
    }),

    deleteVideo: builder.mutation<{ message: string }, number>({
      query: (videoId) => ({ url: `/video/${videoId}`, method: "DELETE" }),
      invalidatesTags: ["Video"],
    }),

    // ======================== LIKES ========================

    likeVideo: builder.mutation<LikeResponse, number>({
      query: (videoId) => ({ url: `/like/${videoId}`, method: "POST" }),
      // After like/unlike, re-fetch like status + video metadata (for count)
      invalidatesTags: (_r, _e, videoId) => [
        { type: "Like", id: videoId },
        { type: "Video", id: videoId },
      ],
    }),

    checkLiked: builder.query<LikeCheckResponse, number>({
      query: (videoId) => `/liked/${videoId}`,
      providesTags: (_r, _e, videoId) => [{ type: "Like", id: videoId }],
    }),

    // ======================== COMMENTS ========================

    getComments: builder.query<
      CommentsResponse,
      { videoId: number; page?: number; limit?: number }
    >({
      query: ({ videoId, page = 1, limit = 10 }) => ({
        url: `/comments/${videoId}`,
        params: { page, limit },
      }),
      providesTags: ["Comment"],
    }),

    addComment: builder.mutation<
      { message: string; comment: Comment },
      { videoId: number; content: string }
    >({
      query: ({ videoId, content }) => ({
        url: `/comment/${videoId}`,
        method: "POST",
        ...formBody({ content }),
      }),
      // Re-fetch comments + video metadata (for comment count)
      invalidatesTags: (_r, _e, { videoId }) => [
        "Comment",
        { type: "Video", id: videoId },
      ],
    }),

    editComment: builder.mutation<
      CommentEditResponse,
      { commentId: number; content: string; videoId: number }
    >({
      query: ({ commentId, content }) => ({
        url: `/comment/${commentId}`,
        method: "PUT",
        ...formBody({ content }),
      }),
      invalidatesTags: ["Comment"],
    }),

    deleteComment: builder.mutation<
      { message: string },
      { commentId: number; videoId: number }
    >({
      query: ({ commentId }) => ({
        url: `/comment/${commentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_r, _e, { videoId }) => [
        "Comment",
        { type: "Video", id: videoId },
      ],
    }),

    // ======================== PROFILE ========================

    getProfile: builder.query<UserProfile, number>({
      query: (userId) => `/profile-data/${userId}`,
      providesTags: (_r, _e, userId) => [{ type: "Profile", id: userId }],
    }),

    updateProfile: builder.mutation<
      { message: string; username: string; about: string },
      { username: string; about: string }
    >({
      query: ({ username, about }) => ({
        url: "/profile",
        method: "PUT",
        ...formBody({ username, about }),
      }),
      invalidatesTags: ["Profile"],
    }),

    uploadProfileImage: builder.mutation<
      { message: string; profile_image: string },
      File
    >({
      query: (file) => {
        const fd = new FormData();
        fd.append("file", file);
        return { url: "/profile/image", method: "POST", body: fd };
      },
      invalidatesTags: ["Profile"],
    }),

    uploadCoverImage: builder.mutation<
      { message: string; cover_image: string },
      File
    >({
      query: (file) => {
        const fd = new FormData();
        fd.append("file", file);
        return { url: "/profile/cover", method: "POST", body: fd };
      },
      invalidatesTags: ["Profile"],
    }),
  }),
});

export const {
  useGetVideosQuery,
  useUploadVideoMutation,
  useStreamVideoQuery,
  useGetVideoMetadataQuery,
  useGetUserVideosQuery,
  useDeleteVideoMutation,
  useLikeVideoMutation,
  useCheckLikedQuery,
  useGetCommentsQuery,
  useAddCommentMutation,
  useEditCommentMutation,
  useDeleteCommentMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useUploadProfileImageMutation,
  useUploadCoverImageMutation,
} = apiSlice;
