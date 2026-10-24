"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BarChart3, Bold, EllipsisVertical, ImagePlus, Italic, MessageCircle, Pencil, Plus, Send, Trash2, Vote, X } from "lucide-react";
import { Dialog } from "@dhriti/ui/dialog";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { connectService, type ConnectPost, type ConnectPostComment, type UpdateConnectPostInput } from "@/services/connect.service";
import type { ConversationUser } from "@/types/connect.types";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const MAX_IMAGE_PAYLOAD_BYTES = 600 * 1024;
const MAX_COMPRESSED_IMAGE_BYTES = Math.floor(MAX_IMAGE_PAYLOAD_BYTES * 0.72);
const REACTION_EMOJIS = ["👍", "❤️", "🎉", "👏"] as const;
const POLL_DURATIONS = [
  { value: 2 * 60, label: "2 minutes" },
  { value: 5 * 60, label: "5 minutes" },
  { value: 10 * 60, label: "10 minutes" },
  { value: 30 * 60, label: "30 minutes" },
  { value: 60 * 60, label: "1 hour" },
  { value: 8 * 60 * 60, label: "8 hours" },
  { value: 7 * 24 * 60 * 60, label: "1 week" },
] as const;

type ConnectPostsViewProps = {
  organizationId: string;
  channelId: string;
  channelName: string;
  currentUserId: string;
  usersById: Record<string, ConversationUser>;
  renderHeader: (onCreatePost: () => void) => ReactNode;
};

type PollDraft = {
  options: string[];
  allowsVoteChanges: boolean;
  closeAfterSeconds: number;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

async function readImage(file: File | undefined) {
  if (!file) return "";
  if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Images must be 2 MB or smaller.");
  if (file.size > MAX_COMPRESSED_IMAGE_BYTES && file.type === "image/gif") {
    throw new Error("Animated GIFs must be 600 KB or smaller because they cannot be compressed without losing animation.");
  }

  const image = file.size > MAX_COMPRESSED_IMAGE_BYTES ? await compressImage(file) : file;
  return ensureImagePayloadSize(await readImageDataUrl(image));
}

function readImageDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read image."));
    reader.onerror = () => reject(new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

async function compressImage(file: File): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);
  const image = new Image();

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to load image for compression."));
      image.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    const ratio = Math.min(1, 1920 / Math.max(image.naturalWidth, image.naturalHeight));
    let width = Math.max(1, Math.round(image.naturalWidth * ratio));
    let height = Math.max(1, Math.round(image.naturalHeight * ratio));
    let quality = 0.9;

    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Unable to prepare image for compression.");
      context.drawImage(image, 0, 0, width, height);
      const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (!compressed) throw new Error("Unable to compress image.");
      if (compressed.size <= MAX_COMPRESSED_IMAGE_BYTES) return compressed;

      width = Math.max(1, Math.round(width * 0.8));
      height = Math.max(1, Math.round(height * 0.8));
      quality = Math.max(0.5, quality - 0.08);
    }
  } finally {
    URL.revokeObjectURL(imageUrl);
  }

  throw new Error("Unable to compress the image below 600 KB. Choose a smaller image.");
}

async function ensureImagePayloadSize(imageUrl: string): Promise<string> {
  if (imageUrl.length <= MAX_IMAGE_PAYLOAD_BYTES) return imageUrl;

  const image = await fetch(imageUrl).then((response) => response.blob());
  if (image.type === "image/gif") {
    throw new Error("Animated GIFs must be 600 KB or smaller because they cannot be compressed without losing animation.");
  }
  const compressed = await compressImage(new File([image], "post-image", { type: image.type }));
  const compressedUrl = await readImageDataUrl(compressed);
  if (compressedUrl.length > MAX_IMAGE_PAYLOAD_BYTES) {
    throw new Error("Unable to compress the image payload below 600 KB. Choose a smaller image.");
  }
  return compressedUrl;
}

export function ConnectPostsView({
  organizationId,
  channelId,
  channelName,
  currentUserId,
  usersById,
  renderHeader,
}: ConnectPostsViewProps) {
  const [posts, setPosts] = useState<ConnectPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<ConnectPost | null>(null);
  const [postToEdit, setPostToEdit] = useState<ConnectPost | null>(null);
  const [commentToEdit, setCommentToEdit] = useState<{ postId: string; comment: ConnectPostComment } | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const initialScrollChannelRef = useRef<string | null>(null);

  async function refresh(showLoading = false) {
    if (showLoading) setLoading(true);
    setError("");
    try {
      setPosts(await connectService.listPosts(organizationId, channelId));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load posts.");
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      void refresh(true);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [channelId, organizationId]);

  useEffect(() => {
    if (loading || posts.length === 0 || initialScrollChannelRef.current === channelId) return;

    const frameId = window.requestAnimationFrame(() => {
      const feed = feedRef.current;
      const unreadPosts = feed?.querySelectorAll<HTMLElement>("[data-unread-post]");
      const latestUnreadPost = unreadPosts?.[unreadPosts.length - 1];

      if (latestUnreadPost) {
        latestUnreadPost.scrollIntoView({ block: "end" });
        void connectService.markMessagesRead(organizationId, channelId).catch((reason) => {
          setError(reason instanceof Error ? reason.message : "Unable to mark posts as read.");
        });
      }
      initialScrollChannelRef.current = channelId;
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [channelId, loading, organizationId, posts]);

  async function vote(postId: string, optionId: string) {
    try {
      const post = posts.find((item) => item.id === postId);
      if (!post?.poll) return;
      await connectService.voteOnPoll(organizationId, post.poll.id, optionId);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to record vote.");
    }
  }

  async function deletePost() {
    if (!postToDelete) return;
    try {
      await connectService.deletePost(organizationId, postToDelete.id);
      setPostToDelete(null);
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete post.");
    }
  }

  async function updatePost(postId: string, input: UpdateConnectPostInput) {
    try {
      const updatedPost = await connectService.updatePost(organizationId, postId, input);
      setPosts((currentPosts) => currentPosts.map((post) => (post.id === postId ? updatedPost : post)));
      setPostToEdit(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update post.");
      throw reason;
    }
  }

  async function comment(postId: string, content: string) {
    try {
      const createdComment = await connectService.createPostComment(organizationId, postId, content);
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, comments: [...post.comments, createdComment] } : post,
        ),
      );
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Unable to add comment.";
      setError(message);
      throw new Error(message);
    }
  }

  async function react(postId: string, emoji: string, currentReaction?: string) {
    const nextReaction = currentReaction === emoji ? undefined : emoji;
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              reactions: [
                ...post.reactions.filter((reaction) => reaction.userId !== currentUserId),
                ...(nextReaction ? [{ userId: currentUserId, emoji: nextReaction }] : []),
              ],
            }
          : post,
      ),
    );
    try {
      if (currentReaction === emoji) {
        await connectService.removePostReaction(organizationId, postId, emoji);
      } else {
        await connectService.addPostReaction(organizationId, postId, emoji);
      }
    } catch (reason) {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                reactions: [
                  ...post.reactions.filter((reaction) => reaction.userId !== currentUserId),
                  ...(currentReaction ? [{ userId: currentUserId, emoji: currentReaction }] : []),
                ],
              }
            : post,
        ),
      );
      setError(reason instanceof Error ? reason.message : "Unable to update reaction.");
    }
  }

  async function deleteComment(postId: string, commentId: string) {
    try {
      await connectService.deletePostComment(organizationId, commentId);
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId ? { ...post, comments: post.comments.filter((comment) => comment.id !== commentId) } : post,
        ),
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete comment.");
    }
  }

  async function updateComment(postId: string, commentId: string, content: string) {
    try {
      const updatedComment = await connectService.updatePostComment(organizationId, commentId, content);
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id === postId
            ? { ...post, comments: post.comments.map((comment) => (comment.id === commentId ? updatedComment : comment)) }
            : post,
        ),
      );
      setCommentToEdit(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update comment.");
      throw reason;
    }
  }

  async function reactToComment(postId: string, commentId: string, emoji: string, currentReaction?: string) {
    const nextReaction = currentReaction === emoji ? undefined : emoji;
    const updateReaction = (reaction: string | undefined) => {
      setPosts((currentPosts) =>
        currentPosts.map((post) =>
          post.id !== postId
            ? post
            : {
                ...post,
                comments: post.comments.map((comment) =>
                  comment.id !== commentId
                    ? comment
                    : {
                        ...comment,
                        reactions: [
                          ...comment.reactions.filter((item) => item.userId !== currentUserId),
                          ...(reaction ? [{ userId: currentUserId, emoji: reaction }] : []),
                        ],
                      },
                ),
              },
        ),
      );
    };

    updateReaction(nextReaction);
    try {
      if (currentReaction === emoji) {
        await connectService.removePostCommentReaction(organizationId, commentId, emoji);
      } else {
        await connectService.addPostCommentReaction(organizationId, commentId, emoji);
      }
    } catch (reason) {
      updateReaction(currentReaction);
      setError(reason instanceof Error ? reason.message : "Unable to update comment reaction.");
    }
  }

  const isEmpty = !loading && posts.length === 0;

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface [&_a]:cursor-pointer [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed">
      {renderHeader(() => setCreatePostOpen(true))}
      <div ref={feedRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        <div className={`mx-auto flex w-full max-w-3xl flex-col ${isEmpty ? "min-h-full justify-center" : "gap-4"}`}>
          {error ? <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error">{error}</p> : null}
          {loading ? <p className="py-8 text-center text-sm text-text-secondary">Loading posts...</p> : null}
          {isEmpty ? (
            <div className="flex min-h-full items-center justify-center px-4 py-8">
              <img src="/media/empty_posts.png" alt="No posts yet" className="h-70 w-90 object-cover" />
            </div>
          ) : null}
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              author={usersById[post.authorId]}
              onVote={vote}
              onDelete={() => setPostToDelete(post)}
              onEdit={() => setPostToEdit(post)}
              onComment={comment}
              onReact={react}
              onDeleteComment={deleteComment}
              onEditComment={(comment) => setCommentToEdit({ postId: post.id, comment })}
              onReactToComment={reactToComment}
            />
          ))}
        </div>
      </div>
      <Dialog
        open={createPostOpen}
        onClose={() => setCreatePostOpen(false)}
        title={`Create post in ${channelName}`}
        secondaryActionLabel=""
        maxWidth="md"
      >
        <PostComposer
          organizationId={organizationId}
          channelId={channelId}
          onPublished={async () => {
            await refresh();
            setCreatePostOpen(false);
          }}
          onError={setError}
        />
      </Dialog>
      <ConfirmationDialog
        open={Boolean(postToDelete)}
        title="Delete post"
        description="This permanently removes your post from the channel."
        confirmLabel="Delete post"
        confirmColor="error"
        onCancel={() => setPostToDelete(null)}
        onConfirm={() => void deletePost()}
      />
      {postToEdit ? <EditPostDialog post={postToEdit} organizationId={organizationId} channelId={channelId} onClose={() => setPostToEdit(null)} onSave={updatePost} /> : null}
      {commentToEdit ? <EditCommentDialog comment={commentToEdit.comment} onClose={() => setCommentToEdit(null)} onSave={(content) => updateComment(commentToEdit.postId, commentToEdit.comment.id, content)} /> : null}
    </div>
  );
}

function PostComposer({
  channelId,
  organizationId,
  onPublished,
  onError,
  initialPost,
  onUpdate,
}: {
  organizationId: string;
  channelId: string;
  onPublished: () => Promise<void>;
  onError: (message: string) => void;
  initialPost?: ConnectPost;
  onUpdate?: (postId: string, input: UpdateConnectPostInput) => Promise<void>;
}) {
  const isEditing = Boolean(initialPost);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [imageUrl, setImageUrl] = useState(initialPost?.imageUrl ?? "");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(initialPost?.backgroundImageUrl ?? "");
  const [backgroundTone, setBackgroundTone] = useState<"surface" | "raised" | "brand">(
    initialPost?.backgroundColor === "var(--app-color-brand-muted)"
      ? "brand"
      : initialPost?.backgroundColor === "var(--app-color-surface-raised)"
        ? "raised"
        : "surface",
  );
  const [poll, setPoll] = useState<PollDraft | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function format(selection: "**" | "*") {
    const element = contentRef.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const selected = content.slice(start, end);
    const next = `${content.slice(0, start)}${selection}${selected || "text"}${selection}${content.slice(end)}`;
    setContent(next);
    window.requestAnimationFrame(() => {
      element.focus();
      const cursor = selected ? end + selection.length * 2 : start + selection.length;
      element.setSelectionRange(cursor, cursor);
    });
  }

  async function submit() {
    if (!content.trim()) {
      onError("Add post content.");
      return;
    }
    if (poll && poll.options.filter((option) => option.trim()).length < 2) {
      onError("A poll needs at least two options.");
      return;
    }
    setSubmitting(true);
    onError("");
    try {
      const [compressedImageUrl, compressedBackgroundImageUrl] = await Promise.all([
        imageUrl ? ensureImagePayloadSize(imageUrl) : Promise.resolve(""),
        backgroundImageUrl ? ensureImagePayloadSize(backgroundImageUrl) : Promise.resolve(""),
      ]);
      const input = {
        content: content.trim(),
        contentHtml: content.trim().replace(/\n/g, "<br>"),
        imageUrl: compressedImageUrl || undefined,
        backgroundImageUrl: compressedBackgroundImageUrl || undefined,
        backgroundColor: backgroundTone === "brand" ? "var(--app-color-brand-muted)" : backgroundTone === "raised" ? "var(--app-color-surface-raised)" : "var(--app-color-surface)",
      };
      if (initialPost && onUpdate) {
        await onUpdate(initialPost.id, {
          ...input,
          title: title.trim() || null,
          imageUrl: compressedImageUrl || null,
          backgroundImageUrl: compressedBackgroundImageUrl || null,
        });
      } else {
        await connectService.createPost(organizationId, channelId, {
          ...input,
          ...(title.trim() ? { title: title.trim() } : {}),
        poll: poll
          ? {
              options: poll.options.map((option) => ({ content: option.trim() })).filter((option) => option.content),
              allowsVoteChanges: poll.allowsVoteChanges,
              closesAt: new Date(Date.now() + poll.closeAfterSeconds * 1000).toISOString(),
            }
          : undefined,
        });
      }
      if (!isEditing) {
        setTitle("");
        setContent("");
        setImageUrl("");
        setBackgroundImageUrl("");
        setBackgroundTone("surface");
        setPoll(null);
      }
      await onPublished();
    } catch (reason) {
      onError(reason instanceof Error ? reason.message : "Unable to publish post.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Post title"
        className="w-full bg-transparent text-lg font-semibold text-text-primary outline-none placeholder:text-text-muted"
      />
      <div className="mt-3 flex items-center gap-1 border-y border-border py-2">
        <button type="button" onClick={() => format("**")} className="grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-surface-raised" aria-label="Bold">
          <Bold size={16} />
        </button>
        <button type="button" onClick={() => format("*")} className="grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-surface-raised" aria-label="Italic">
          <Italic size={16} />
        </button>
      </div>
      <textarea
        ref={contentRef}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Share an update with your team..."
        rows={4}
        className="mt-3 w-full resize-y bg-transparent text-sm leading-6 text-text-primary outline-none placeholder:text-text-muted"
      />
      {imageUrl ? <div className="relative mt-3 h-[200px] overflow-hidden rounded-lg bg-surface-raised"><img src={imageUrl} alt="Selected post" className="h-full w-full object-contain" /><button type="button" onClick={() => setImageUrl("")} aria-label="Remove post image" title="Remove post image" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-surface/90 text-text-primary shadow-sm hover:bg-surface"><X size={16} /></button></div> : null}
      {backgroundImageUrl ? <div className="relative mt-3"><img src={backgroundImageUrl} alt="Selected post background" className="h-[200px] w-full rounded-lg object-cover" /><button type="button" onClick={() => setBackgroundImageUrl("")} aria-label="Remove background image" title="Remove background image" className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-surface/90 text-text-primary shadow-sm hover:bg-surface"><X size={16} /></button></div> : null}
      {poll ? <PollComposer value={poll} onChange={setPoll} onRemove={() => setPoll(null)} /> : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <ImagePicker label="Add image" onImage={(file) => readImage(file).then(setImageUrl).catch((reason) => onError(reason.message))} />
        <ImagePicker label="Background image" onImage={(file) => readImage(file).then(setBackgroundImageUrl).catch((reason) => onError(reason.message))} />
        <select
          value={backgroundTone}
          onChange={(event) => setBackgroundTone(event.target.value as "surface" | "raised" | "brand")}
          className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-text-secondary"
          aria-label="Post background"
        >
          <option value="surface">Default background</option>
          <option value="raised">Raised background</option>
          <option value="brand">Brand background</option>
        </select>
        {!poll && !isEditing ? (
          <button type="button" onClick={() => setPoll({ options: ["", ""], allowsVoteChanges: true, closeAfterSeconds: 5 * 60 })} className="inline-flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-sm font-semibold text-text-secondary hover:bg-surface-raised">
            <BarChart3 size={16} /> Add poll
          </button>
        ) : null}
        <button type="button" disabled={submitting} onClick={() => void submit()} className="ml-auto inline-flex items-center gap-1.5 rounded bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
          <Send size={16} /> {submitting ? (isEditing ? "Saving..." : "Publishing...") : (isEditing ? "Save changes" : "Publish")}
        </button>
      </div>
    </section>
  );
}

function ImagePicker({ label, onImage }: { label: string; onImage: (file: File | undefined) => void }) {
  return <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-border px-2.5 py-1.5 text-sm font-semibold text-text-secondary hover:bg-surface-raised"><ImagePlus size={16} />{label}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="sr-only" onChange={(event) => onImage(event.target.files?.[0])} /></label>;
}

function PollComposer({ value, onChange, onRemove }: { value: PollDraft; onChange: (value: PollDraft) => void; onRemove: () => void }) {
  const updateOption = (index: number, next: string) => onChange({ ...value, options: value.options.map((option, optionIndex) => optionIndex === index ? next : option) });
  return <div className="mt-3 rounded-lg border border-border bg-surface-raised p-3">
    <div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-primary"><Vote size={16} /> Poll</span><button type="button" onClick={onRemove} className="text-text-secondary hover:text-text-primary" aria-label="Remove poll"><X size={16} /></button></div>
    <div className="mt-2 space-y-2">{value.options.map((option, index) => <input key={index} value={option} onChange={(event) => updateOption(index, event.target.value)} placeholder={`Option ${index + 1}`} className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand" />)}</div>
    <button type="button" onClick={() => onChange({ ...value, options: [...value.options, ""] })} className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand"><Plus size={15} /> Add option</button>
    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-secondary"><label className="inline-flex items-center gap-2"><input type="checkbox" checked={value.allowsVoteChanges} onChange={(event) => onChange({ ...value, allowsVoteChanges: event.target.checked })} className="accent-brand" /> Allow vote changes</label><select value={value.closeAfterSeconds} onChange={(event) => onChange({ ...value, closeAfterSeconds: Number(event.target.value) })} className="rounded border border-border bg-surface px-2 py-1 text-sm text-text-primary">{POLL_DURATIONS.map((duration) => <option key={duration.value} value={duration.value}>Closes in {duration.label}</option>)}</select></div>
  </div>;
}

function PostCard({
  post,
  currentUserId,
  author,
  onVote,
  onDelete,
  onEdit,
  onComment,
  onReact,
  onDeleteComment,
  onEditComment,
  onReactToComment,
}: {
  post: ConnectPost;
  currentUserId: string;
  author?: ConversationUser;
  onVote: (postId: string, optionId: string) => void;
  onDelete: () => void;
  onEdit: () => void;
  onComment: (postId: string, content: string) => Promise<void>;
  onReact: (postId: string, emoji: string, currentReaction?: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onEditComment: (comment: ConnectPostComment) => void;
  onReactToComment: (postId: string, commentId: string, emoji: string, currentReaction?: string) => void;
}) {
  const poll = post.poll;
  const totalVotes = poll?.options.reduce((sum, option) => sum + option.voteCount, 0) ?? 0;
  const isClosed = poll?.closesAt ? new Date(poll.closesAt) <= new Date() : false;
  const backgroundClass = post.backgroundColor === "var(--app-color-brand-muted)" ? "bg-brand/10" : post.backgroundColor === "var(--app-color-surface-raised)" ? "bg-surface-raised" : "bg-surface";
  const [comment, setComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [contentExpanded, setContentExpanded] = useState(false);
  const [contentOverflows, setContentOverflows] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);
  const currentReaction = post.reactions.find((reaction) => reaction.userId === currentUserId)?.emoji;
  const reactionCounts = post.reactions.reduce<Record<string, number>>((counts, reaction) => {
    counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
    return counts;
  }, {});

  async function submitComment() {
    if (!comment.trim()) return;
    setSubmittingComment(true);
    setCommentError("");
    try {
      await onComment(post.id, comment.trim());
      setComment("");
    } catch (reason) {
      setCommentError(reason instanceof Error ? reason.message : "Unable to add comment.");
    } finally {
      setSubmittingComment(false);
    }
  }

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const element = contentRef.current;
      if (element) setContentOverflows(element.scrollHeight > element.clientHeight);
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [post.content]);

  return (
    <article data-unread-post={post.isUnread ? "true" : undefined} className={`overflow-hidden rounded-xl border border-border ${backgroundClass} shadow-sm`}>
      {post.backgroundImageUrl ? <img src={post.backgroundImageUrl} alt="" className="h-28 w-full object-cover" /> : null}
      <div className="p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-surface-raised text-xs font-bold text-text-primary">{(author?.displayName ?? "U").slice(0, 1)}</span>
          <div>
            <p className="text-sm font-semibold text-text-primary">{author?.displayName ?? "Unknown user"}</p>
            <time className="text-xs text-text-secondary">{formatTime(post.createdAt)}</time>
          </div>
          {post.authorId === currentUserId ? <button type="button" onClick={(event) => setMenuAnchor(event.currentTarget)} className="ml-auto grid h-8 w-8 place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-text-primary" aria-label="Post actions" title="Post actions"><EllipsisVertical size={18} /></button> : null}
        </div>
        {post.title ? <h3 className="mt-4 text-lg font-bold text-text-primary">{post.title}</h3> : null}
        <div className="relative mt-2">
          <p ref={contentRef} className={`whitespace-pre-wrap text-sm leading-6 text-text-primary ${contentExpanded ? "" : "max-h-[300px] overflow-hidden"}`}>{post.content}</p>
          {contentOverflows && !contentExpanded ? <div className="absolute inset-x-0 bottom-0 flex justify-center bg-linear-to-t from-surface via-surface/95 pt-8 text-sm"><button type="button" onClick={() => setContentExpanded(true)} className="font-semibold text-brand hover:text-brand-dark">Show more</button></div> : null}
        </div>
        {post.imageUrl ? <img src={post.imageUrl} alt="" className="mt-4 max-h-[200px] w-full rounded-lg bg-surface-raised object-contain" /> : null}
        {poll ? <div className="mt-4 rounded-lg border border-border bg-surface p-3"><div className="mt-3 space-y-2">{poll.options.map((option) => { const percentage = totalVotes ? Math.round(option.voteCount / totalVotes * 100) : 0; const selected = option.id === poll.currentVote?.pollOptionId; return <button key={option.id} type="button" disabled={isClosed || (Boolean(poll.currentVote) && !poll.allowsVoteChanges)} onClick={() => onVote(post.id, option.id)} className={`relative w-full overflow-hidden rounded border px-3 py-2 text-left text-sm ${selected ? "border-brand" : "border-border"} disabled:cursor-default`}><span className="absolute inset-y-0 left-0 bg-brand/10" style={{ width: `${percentage}%` }} /><span className="relative flex justify-between gap-3"><span>{option.content}</span><span>{percentage}%</span></span></button>; })}</div><p className="mt-3 text-xs text-text-secondary">{totalVotes} votes · {isClosed ? "Closed" : poll.closesAt ? `Closes ${formatTime(poll.closesAt)}` : "Open"}</p></div> : null}

        <div className="mt-4 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {REACTION_EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => onReact(post.id, emoji, currentReaction)} className={`inline-flex h-8 min-w-8 items-center justify-center gap-1 rounded-full border px-2 text-sm ${currentReaction === emoji ? "border-brand bg-brand/10" : "border-border hover:bg-surface-raised"}`} aria-label={`React with ${emoji}`}>{emoji}{reactionCounts[emoji] ? <span>{reactionCounts[emoji]}</span> : null}</button>)}
            <span className="ml-auto inline-flex items-center gap-1 text-xs text-text-secondary"><MessageCircle size={14} /> {post.comments.length} comments</span>
          </div>
          <div className="mt-3 flex gap-2">
            <input value={comment} onChange={(event) => setComment(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void submitComment(); }} placeholder="Write a comment..." className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand" />
            <button type="button" disabled={submittingComment || !comment.trim()} onClick={() => void submitComment()} aria-label="Add comment" title="Add comment" className="grid h-9 w-9 place-items-center rounded-md bg-brand text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"><Send size={15} /></button>
          </div>
          {commentError ? <p role="alert" className="mt-2 text-sm text-error">{commentError}</p> : null}
          {commentsVisible && post.comments.length > 0 ? <div className="mt-4 space-y-3 border-t border-border pt-4">{post.comments.map((item) => {
            const commentReaction = item.reactions.find((reaction) => reaction.userId === currentUserId)?.emoji;
            const commentReactionCounts = item.reactions.reduce<Record<string, number>>((counts, reaction) => {
              counts[reaction.emoji] = (counts[reaction.emoji] ?? 0) + 1;
              return counts;
            }, {});
            const canDelete = item.authorId === currentUserId || post.authorId === currentUserId;
            const canEdit = item.authorId === currentUserId;
            return <div key={item.id} className="flex gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-raised text-xs font-bold text-text-primary">{item.author.name.slice(0, 1)}</span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="text-sm font-semibold text-text-primary">{item.author.name}</p><time className="text-xs text-text-muted">{formatTime(item.createdAt)}</time>{canEdit || canDelete ? <CommentActions onEdit={canEdit ? () => onEditComment(item) : undefined} onDelete={canDelete ? () => onDeleteComment(post.id, item.id) : undefined} /> : null}</div><p className="whitespace-pre-wrap text-sm text-text-secondary">{item.content}</p><div className="mt-2 flex flex-wrap gap-1.5">{REACTION_EMOJIS.map((emoji) => <button key={emoji} type="button" onClick={() => onReactToComment(post.id, item.id, emoji, commentReaction)} className={`inline-flex h-7 min-w-7 items-center justify-center gap-1 rounded-full border px-1.5 text-xs ${commentReaction === emoji ? "border-brand bg-brand/10" : "border-border hover:bg-surface-raised"}`} aria-label={`React to comment with ${emoji}`}>{emoji}{commentReactionCounts[emoji] ? <span>{commentReactionCounts[emoji]}</span> : null}</button>)}</div></div></div>;
          })}</div> : null}
          {post.comments.length > 0 ? <button type="button" onClick={() => setCommentsVisible((visible) => !visible)} className="mt-4 flex w-full justify-center text-sm font-semibold text-brand hover:text-brand-dark" aria-expanded={commentsVisible}>{commentsVisible ? "Hide comments" : "Show comments"}</button> : null}
        </div>
      </div>
      <ConnectCascadingMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        minWidth={180}
        items={[
          { id: "edit-post", label: "Edit post", icon: <Pencil size={16} />, onClick: onEdit },
          { id: "delete-post", label: "Delete post", icon: <Trash2 size={16} />, danger: true, onClick: onDelete },
        ]}
      />
    </article>
  );
}

function CommentActions({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <button type="button" onClick={(event) => setMenuAnchor(event.currentTarget)} className="ml-auto grid h-7 w-7 place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-text-primary" aria-label="Comment actions" title="Comment actions">
        <EllipsisVertical size={16} />
      </button>
      <ConnectCascadingMenu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
        minWidth={180}
        items={[
          ...(onEdit ? [{ id: "edit-comment", label: "Edit comment", icon: <Pencil size={16} />, onClick: onEdit }] : []),
          ...(onDelete ? [{ id: "delete-comment", label: "Delete comment", icon: <Trash2 size={16} />, danger: true, onClick: onDelete }] : []),
        ]}
      />
    </>
  );
}

function EditCommentDialog({
  comment,
  onClose,
  onSave,
}: {
  comment: ConnectPostComment;
  onClose: () => void;
  onSave: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState(comment.content);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function save() {
    if (!content.trim()) {
      setError("Enter a comment.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSave(content.trim());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update comment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title="Edit comment" primaryActionLabel="Save changes" onPrimaryAction={save} isSubmitting={submitting} maxWidth="sm">
      <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={4} className="w-full resize-y rounded-md border border-border bg-surface px-3 py-2 text-text-primary outline-none focus:border-brand" />
      {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
    </Dialog>
  );
}

function EditPostDialog({
  post,
  organizationId,
  channelId,
  onClose,
  onSave,
}: {
  post: ConnectPost;
  organizationId: string;
  channelId: string;
  onClose: () => void;
  onSave: (postId: string, input: UpdateConnectPostInput) => Promise<void>;
}) {
  const [error, setError] = useState("");

  return (
    <Dialog open onClose={onClose} title="Edit post" secondaryActionLabel="" maxWidth="md">
      <PostComposer
        organizationId={organizationId}
        channelId={channelId}
        initialPost={post}
        onUpdate={onSave}
        onPublished={async () => onClose()}
        onError={setError}
      />
      {error ? <p role="alert" className="mt-2 text-sm text-error">{error}</p> : null}
    </Dialog>
  );
}
