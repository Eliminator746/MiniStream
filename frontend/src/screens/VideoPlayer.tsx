import { useParams } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  useGetVideoMetadataQuery,
  useStreamVideoQuery,
  useCheckLikedQuery,
  useLikeVideoMutation,
  useGetCommentsQuery,
} from "@/features/apiSlice";
import VideoHeader from "@/components/VideoHeader";
import CommentForm from "@/components/CommentForm";
import Comment from "@/components/Comments";
import { COMMENTS_LIMIT } from "@/constants";
import { useAppSelector } from "@/store/hooks";
import type { Comment as CommentType } from "@/features/types";

const VideoPage: React.FC = () => {
  const { id } = useParams();
  const videoId = Number(id);
  const [page, setPage] = useState(1);
  const [allComments, setAllComments] = useState<CommentType[]>([]);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const commentScrollRef = useRef<HTMLDivElement>(null);
  const currentUser = useAppSelector((state) => state.auth.user);

  const { data: metadata, isLoading: metaLoading } =
    useGetVideoMetadataQuery(videoId);
  const { data: streamData } = useStreamVideoQuery(videoId);
  const { data: likeData } = useCheckLikedQuery(videoId);
  const { data: commentsData, isFetching: commentsFetching } =
    useGetCommentsQuery({
      videoId,
      page,
      limit: COMMENTS_LIMIT,
    });

  const [likeVideo, { isLoading: isLiking }] = useLikeVideoMutation();

  // Accumulate comments as pages load
  useEffect(() => {
    if (commentsData) {
      setAllComments((prev) => {
        const existingIds = new Set(prev.map((c) => c.id));
        const newComments = commentsData.comments.filter(
          (c) => !existingIds.has(c.id),
        );
        return [...prev, ...newComments];
      });
      setHasMoreComments(commentsData.total > page * COMMENTS_LIMIT);
    }
  }, [commentsData, page]);

  // Scroll-based loading for comments
  const handleCommentScroll = useCallback(() => {
    const el = commentScrollRef.current;
    if (!el || commentsFetching || !hasMoreComments) return;

    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    if (nearBottom) {
      setPage((p) => p + 1);
    }
  }, [commentsFetching, hasMoreComments]);

  const handleLikeToggle = async () => {
    try {
      await likeVideo(videoId).unwrap();
    } catch (err) {
      console.error("Like failed:", err);
    }
  };

  if (metaLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-57px)]">
        <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!metadata) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-57px)] text-slate-500">
        Video not found
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-57px)] overflow-y-auto no-scrollbar">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Video Player */}
        <div className="rounded-xl overflow-hidden bg-black shadow-lg">
          <video
            controls
            className="w-full max-h-[70vh]"
            src={streamData?.video_url}
            poster={metadata.thumbnail}
          />
        </div>

        {/* Video Header (title, uploader, like) */}
        <VideoHeader
          video={metadata}
          liked={likeData?.liked ?? false}
          onLikeToggle={handleLikeToggle}
          isLoadingLike={isLiking}
        />

        {/* Comments Section */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-800">
              {metadata.comments_count} Comments
            </h2>
          </div>

          <div className="px-5 py-4">
            <CommentForm videoId={videoId} />
          </div>

          {/* Scrollable comments container */}
          <div
            ref={commentScrollRef}
            onScroll={handleCommentScroll}
            className="max-h-125 overflow-y-auto thin-scrollbar px-5 pb-4"
          >
            {allComments.length === 0 && !commentsFetching && (
              <p className="text-sm text-slate-400 text-center py-8">
                No comments yet. Be the first!
              </p>
            )}

            {allComments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                videoId={videoId}
                currentUserName={currentUser?.name}
              />
            ))}

            {commentsFetching && (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPage;
