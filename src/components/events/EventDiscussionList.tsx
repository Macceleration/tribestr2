import type { NostrEvent } from "@nostrify/nostrify";
import { useAuthor } from "@/hooks/useAuthor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { NoteContent } from "@/components/NoteContent";
import { MessageSquare, Reply } from "lucide-react";
import { genUserName } from "@/lib/genUserName";

interface EventDiscussionListProps {
  comments: NostrEvent[];
  isLoading: boolean;
  getDirectReplies?: (commentId: string) => NostrEvent[];
}

interface DiscussionCommentProps {
  comment: NostrEvent;
  getDirectReplies?: (commentId: string) => NostrEvent[];
  level?: number;
}

function DiscussionComment({ comment, getDirectReplies, level = 0 }: DiscussionCommentProps) {
  const author = useAuthor(comment.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || genUserName(comment.pubkey);

  const replies = getDirectReplies ? getDirectReplies(comment.id) : [];
  const maxLevel = 3; // Limit nesting depth

  return (
    <div className={`${level > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 mt-1">
              <AvatarImage src={metadata?.picture} alt={displayName} />
              <AvatarFallback className="text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-medium text-sm">{displayName}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at * 1000).toLocaleString()}
                </span>
                {comment.kind === 1111 && (
                  <span className="text-xs bg-muted px-1 rounded">comment</span>
                )}
              </div>

              <div className="prose prose-sm max-w-none">
                <NoteContent event={comment} className="text-sm" />
              </div>

              {replies.length > 0 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <Reply className="h-3 w-3" />
                  {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Show replies if within nesting limit */}
      {replies.length > 0 && level < maxLevel && (
        <div className="space-y-2">
          {replies.map((reply) => (
            <DiscussionComment
              key={reply.id}
              comment={reply}
              getDirectReplies={getDirectReplies}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* Show "more replies" indicator if we hit the nesting limit */}
      {replies.length > 0 && level >= maxLevel && (
        <div className="ml-6 text-xs text-muted-foreground py-2">
          ... {replies.length} more {replies.length === 1 ? 'reply' : 'replies'}
        </div>
      )}
    </div>
  );
}

export function EventDiscussionList({ comments, isLoading, getDirectReplies }: EventDiscussionListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (comments.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-6">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No discussion yet</h3>
              <p className="text-muted-foreground">
                Be the first to share your thoughts about this event! You can also reply with 'yes', 'no', or 'maybe' to RSVP.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Discussion</h3>
        <span className="text-sm text-muted-foreground">({comments.length})</span>
      </div>

      {comments.map((comment) => (
        <DiscussionComment
          key={comment.id}
          comment={comment}
          getDirectReplies={getDirectReplies}
        />
      ))}
    </div>
  );
}