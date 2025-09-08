import { useState } from "react";
import type { NostrEvent } from "@nostrify/nostrify";
import { NKinds } from "@nostrify/nostrify";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/useToast";
import { MessageSquare, Loader2 } from "lucide-react";

interface EventDiscussionFormProps {
  event: NostrEvent;
}

export function EventDiscussionForm({ event }: EventDiscussionFormProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isSubmitting } = useNostrPublish();
  const { toast } = useToast();
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to post",
        variant: "destructive",
      });
      return;
    }

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    try {
      const tags: string[][] = [];

      // Reference the event
      if (NKinds.addressable(event.kind)) {
        const d = event.tags.find(([name]) => name === 'd')?.[1] ?? '';
        tags.push(['a', `${event.kind}:${event.pubkey}:${d}`]);
      }

      // Always add event ID reference for compatibility
      tags.push(['e', event.id]);

      // Add event author
      tags.push(['p', event.pubkey]);

      // Add hashtags for discoverability
      tags.push(['t', 'event']);
      tags.push(['t', 'discussion']);

      // Add alt tag for accessibility
      const eventTitle = event.tags.find(([name]) => name === 'title')?.[1] || 'event';
      tags.push(['alt', `Discussion about ${eventTitle}`]);

      createEvent({
        kind: 1, // Regular note for maximum compatibility
        content: content.trim(),
        tags,
      });

      toast({
        title: "Posted!",
        description: "Your message has been posted to the discussion",
      });

      setContent("");
    } catch (error) {
      console.error('Error posting to discussion:', error);
      toast({
        title: "Error",
        description: "Failed to post message. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <p className="text-muted-foreground">
            Log in to join the discussion
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Join the Discussion
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts about this event... You can also reply with 'yes', 'no', or 'maybe' to RSVP!"
            rows={4}
            className="resize-none"
          />

          <div className="flex justify-between items-center">
            <p className="text-xs text-muted-foreground">
              Your post will be visible on Nostr and can be seen by other clients
            </p>
            <Button type="submit" disabled={isSubmitting || !content.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}