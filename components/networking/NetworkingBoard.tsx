"use client";
// ============================================================
// 네트워킹 게시판 — 협업제안·기술공유·행사·자유게시판
// ============================================================

import { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Eye,
  Plus,
  ChevronLeft,
  Trash2,
  Pin,
  Send,
} from "lucide-react";
import {
  NetworkPost,
  NetworkComment,
  NetworkCategory,
  NETWORK_CATEGORY_LABEL,
  NETWORK_CATEGORY_COLOR,
  INTEREST_KEYWORDS,
} from "@/types";
import {
  getNetworkPosts,
  getNetworkPost,
  createNetworkPost,
  updateNetworkPost,
  deleteNetworkPost,
  subscribeNetworkComments,
  addNetworkComment,
  deleteNetworkComment,
} from "@/services/networkingService";
import { useAuthContext } from "@/context/AuthContext";
import { timeAgo, formatDate, getInitial, parseTags } from "@/utils/helpers";

type View = "list" | "detail" | "write";

// ─── 카테고리 필터 탭 ─────────────────────────────────────────
const CATEGORIES: Array<{ key: NetworkCategory | "all"; label: string }> = [
  { key: "all", label: "전체" },
  { key: "collaboration", label: "협업제안" },
  { key: "tech_share", label: "기술공유" },
  { key: "event", label: "행사·세미나" },
  { key: "free", label: "자유게시판" },
];

// ─── 입력 필드 공통 클래스 ────────────────────────────────────
const INPUT_CLS =
  "w-full px-3 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500";

// ─── 게시글 목록 뷰 ───────────────────────────────────────────
function PostList({
  onSelect,
  onWrite,
}: {
  onSelect: (post: NetworkPost) => void;
  onWrite: () => void;
}) {
  const { firebaseUser, userProfile } = useAuthContext();
  const [posts, setPosts] = useState<NetworkPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NetworkCategory | "all">("all");

  const load = useCallback(async () => {
    setLoading(true);
    const { posts: data } = await getNetworkPosts(filter === "all" ? undefined : filter);
    setPosts(data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="font-bold text-slate-800 dark:text-slate-100">
          네트워킹 게시판
        </h2>
        {firebaseUser && (
          <button
            onClick={onWrite}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 active:scale-95 transition-transform"
          >
            <Plus size={13} /> 글쓰기
          </button>
        )}
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-1.5 overflow-x-auto px-4 pb-2 scrollbar-none">
        {CATEGORIES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs border transition-colors duration-150 ${
              filter === key
                ? "bg-blue-600 border-blue-600 text-white"
                : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-blue-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 게시글 목록 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400">불러오는 중...</div>
        ) : posts.length === 0 ? (
          <div className="py-10 text-center">
            <MessageSquare size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-2" />
            <p className="text-sm text-slate-400">첫 번째 글을 작성해보세요!</p>
          </div>
        ) : (
          <ul className="space-y-2 pt-1">
            {posts.map((post) => (
              <li
                key={post.id}
                onClick={() => onSelect(post)}
                className="card p-3 cursor-pointer hover:shadow-md transition-shadow duration-150 active:scale-[0.99]"
              >
                {/* 카테고리 + 핀 */}
                <div className="flex items-center gap-1.5 mb-1">
                  {post.pinned && (
                    <Pin size={11} className="text-orange-500 flex-shrink-0" />
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      NETWORK_CATEGORY_COLOR[post.category]
                    }`}
                  >
                    {NETWORK_CATEGORY_LABEL[post.category]}
                  </span>
                </div>

                {/* 제목 */}
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                  {post.title}
                </p>

                {/* 내용 요약 */}
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                  {post.content}
                </p>

                {/* 하단 메타 */}
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-slate-400 truncate flex-1">
                    {post.authorName}
                    {post.authorOrg && ` · ${post.authorOrg}`}
                  </span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <Eye size={9} /> {post.viewCount}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-400">
                      <MessageSquare size={9} /> {post.commentCount}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {timeAgo(post.createdAt)}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── 게시글 상세 뷰 ───────────────────────────────────────────
function PostDetail({
  postId,
  onBack,
}: {
  postId: string;
  onBack: () => void;
}) {
  const { firebaseUser, userProfile, isAdmin } = useAuthContext();
  const [post, setPost] = useState<NetworkPost | null>(null);
  const [comments, setComments] = useState<NetworkComment[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNetworkPost(postId).then((p) => {
      setPost(p);
      setLoading(false);
    });
    const unsub = subscribeNetworkComments(postId, setComments);
    return () => unsub();
  }, [postId]);

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentInput.trim() || !firebaseUser || !userProfile) return;
    setSubmitting(true);
    try {
      await addNetworkComment(postId, {
        content: commentInput.trim(),
        authorId: firebaseUser.uid,
        authorName: userProfile.name,
        authorPhotoURL: userProfile.photoURL,
      });
      setCommentInput("");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeletePost() {
    if (!confirm("게시글을 삭제하시겠습니까?")) return;
    await deleteNetworkPost(postId);
    onBack();
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    await deleteNetworkComment(postId, commentId);
  }

  const canDeletePost =
    isAdmin || post?.authorId === firebaseUser?.uid;

  if (loading) {
    return (
      <div className="p-4 text-center text-sm text-slate-400 py-10">
        불러오는 중...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="p-4 text-center py-10">
        <p className="text-sm text-slate-400">게시글을 찾을 수 없습니다.</p>
        <button onClick={onBack} className="mt-2 text-sm text-blue-600 hover:underline">
          ← 목록으로
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 상단 */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 mb-3"
        >
          <ChevronLeft size={16} /> 목록으로
        </button>

        {/* 카테고리 배지 */}
        <span
          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${
            NETWORK_CATEGORY_COLOR[post.category]
          }`}
        >
          {NETWORK_CATEGORY_LABEL[post.category]}
        </span>

        <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
          {post.title}
        </h1>

        {/* 작성자 & 날짜 */}
        <div className="flex items-center gap-2 mt-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
            {post.authorPhotoURL ? (
              <img
                src={post.authorPhotoURL}
                alt=""
                className="w-7 h-7 rounded-full object-cover"
              />
            ) : (
              getInitial(post.authorName)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
              {post.authorName}
              {post.authorOrg && (
                <span className="text-slate-400 font-normal ml-1">
                  · {post.authorOrg}
                </span>
              )}
            </p>
            <p className="text-[10px] text-slate-400">
              {formatDate(post.createdAt)} · 조회 {post.viewCount}
            </p>
          </div>
          {canDeletePost && (
            <button
              onClick={handleDeletePost}
              className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 본문 + 댓글 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto">
        {/* 본문 */}
        <div className="px-4 py-4">
          <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
            {post.content}
          </p>

          {/* 태그 */}
          {post.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 댓글 구분선 */}
        <div className="px-4 pb-2 border-t border-slate-100 dark:border-slate-700 pt-3">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
            댓글 {comments.length}
          </p>

          {comments.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">
              첫 번째 댓글을 남겨보세요.
            </p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 flex-shrink-0">
                    {c.authorPhotoURL ? (
                      <img
                        src={c.authorPhotoURL}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      getInitial(c.authorName)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        {c.authorName}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {timeAgo(c.createdAt)}
                      </span>
                      {(isAdmin || c.authorId === firebaseUser?.uid) && (
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="ml-auto text-[10px] text-slate-300 hover:text-red-400"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {c.content}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* 댓글 입력창 */}
      {firebaseUser && (
        <form
          onSubmit={handleSubmitComment}
          className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className={`${INPUT_CLS} h-10 flex-1`}
            />
            <button
              type="submit"
              disabled={!commentInput.trim() || submitting}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 transition-colors flex-shrink-0"
            >
              <Send size={15} />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── 글쓰기 폼 ────────────────────────────────────────────────
function WriteForm({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const { firebaseUser, userProfile } = useAuthContext();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<NetworkCategory>("free");
  const [tagsStr, setTagsStr] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !firebaseUser || !userProfile) return;
    setLoading(true);
    setError(null);
    try {
      await createNetworkPost({
        title: title.trim(),
        content: content.trim(),
        category,
        tags: parseTags(tagsStr),
        authorId: firebaseUser.uid,
        authorName: userProfile.name,
        authorOrg: userProfile.organization,
        authorPhotoURL: userProfile.photoURL,
      });
      onSuccess();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={onBack} className="text-slate-500 hover:text-blue-600">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">게시글 작성</h2>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 카테고리 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          카테고리 *
        </label>
        <div className="flex gap-2 flex-wrap">
          {(Object.entries(NETWORK_CATEGORY_LABEL) as [NetworkCategory, string][]).map(
            ([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setCategory(k)}
                className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  category === k
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"
                }`}
              >
                {l}
              </button>
            )
          )}
        </div>
      </div>

      {/* 제목 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          제목 *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="게시글 제목을 입력하세요"
          required
          className={`${INPUT_CLS} h-10`}
        />
      </div>

      {/* 내용 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          내용 *
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요..."
          required
          rows={6}
          className={`${INPUT_CLS} py-3 resize-none`}
        />
      </div>

      {/* 태그 */}
      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          태그 (쉼표 구분)
        </label>
        <input
          type="text"
          value={tagsStr}
          onChange={(e) => setTagsStr(e.target.value)}
          placeholder="예: AI, 협업, 반도체"
          className={`${INPUT_CLS} h-10`}
        />
        {/* 관심분야 키워드 추천 */}
        <div className="flex flex-wrap gap-1 mt-1.5">
          {INTEREST_KEYWORDS.slice(0, 10).map((kw) => (
            <button
              key={kw}
              type="button"
              onClick={() =>
                setTagsStr((prev) =>
                  prev
                    ? prev.includes(kw)
                      ? prev
                      : `${prev}, ${kw}`
                    : kw
                )
              }
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-blue-100 hover:text-blue-600 transition-colors"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>

      {/* 제출 버튼 */}
      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-11 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading || !title.trim() || !content.trim()}
          className="flex-[2] h-11 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "등록 중..." : "등록하기"}
        </button>
      </div>
    </form>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────
export default function NetworkingBoard() {
  const [view, setView] = useState<View>("list");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  function handleSelectPost(post: NetworkPost) {
    setSelectedPostId(post.id);
    setView("detail");
  }

  function handleBack() {
    setView("list");
    setSelectedPostId(null);
  }

  if (view === "write") {
    return (
      <WriteForm
        onBack={handleBack}
        onSuccess={handleBack}
      />
    );
  }

  if (view === "detail" && selectedPostId) {
    return <PostDetail postId={selectedPostId} onBack={handleBack} />;
  }

  return (
    <PostList
      onSelect={handleSelectPost}
      onWrite={() => setView("write")}
    />
  );
}
