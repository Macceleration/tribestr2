import type { NostrEvent } from "@nostrify/nostrify";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useEventDiscussion } from "@/hooks/useEventDiscussion";
import { EventDiscussionRSVP } from "./EventDiscussionRSVP";
import { EventDiscussionForm } from "./EventDiscussionForm";
import { EventDiscussionList } from "./EventDiscussionList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCallback } from "react";

interface EventDiscussionProps {
  event: NostrEvent;
}

export function EventDiscussion({ event }: EventDiscussionProps) {
  const { user } = useCurrentUser();
  const { data: discussionData, isLoading } = useEventDiscussion(event);

  // Check if user is the event host
  const isHost = user?.pubkey === event.pubkey;

  // Function to detect RSVP status from comment content
  const detectRSVPStatus = useCallback((content: string): 'accepted' | 'tentative' | 'declined' | null => {
    const normalizedContent = content.toLowerCase().trim();

    // Check for positive responses
    if (normalizedContent.match(/\b(yes|going|accept|attending|count me in|i'll be there|👍|✅|will attend|coming|see you there)\b/)) {
      return 'accepted';
    }

    // Check for maybe responses
    if (normalizedContent.match(/\b(maybe|might|tentative|possibly|not sure|🤔|might come|will try)\b/)) {
      return 'tentative';
    }

    // Check for negative responses
    if (normalizedContent.match(/\b(no|not going|decline|can't|cannot|won't|unable|❌|not attending|miss|skip)\b/)) {
      return 'declined';
    }

    return null;
  }, []);

  // Get RSVP comments for admin review
  const rsvpComments = discussionData?.allComments?.filter(comment => {
    const status = detectRSVPStatus(comment.content);
    return status !== null && comment.pubkey !== event.pubkey; // Exclude event host's own messages
  }) || [];

  const comments = discussionData?.topLevelComments || [];

  return (
    <div className="space-y-6">
      {isHost && rsvpComments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎫 RSVP Replies Detected
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The following discussion replies contain RSVP keywords. Click "Add as Attendee" to create official RSVPs.
            </p>
            <div className="space-y-3">
              {rsvpComments.map((comment) => {
                const status = detectRSVPStatus(comment.content);
                if (!status) return null;

                return (
                  <EventDiscussionRSVP
                    key={comment.id}
                    event={event}
                    comment={comment}
                    rsvpStatus={status}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      <div className="space-y-6">
        <EventDiscussionForm event={event} />
        <EventDiscussionList
          comments={comments}
          isLoading={isLoading}
          getDirectReplies={discussionData?.getDirectReplies}
        />
      </div>
    </div>
  );
}