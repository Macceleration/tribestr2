import { useState } from "react";
import type { NostrEvent } from "@nostrify/nostrify";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useAuthor } from "@/hooks/useAuthor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { UserPlus, Loader2 } from "lucide-react";

interface EventDiscussionRSVPProps {
  event: NostrEvent;
  comment: NostrEvent;
  rsvpStatus: 'accepted' | 'tentative' | 'declined';
}

export function EventDiscussionRSVP({ event, comment, rsvpStatus }: EventDiscussionRSVPProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isCreating } = useNostrPublish();
  const { toast } = useToast();
  const author = useAuthor(comment.pubkey);
  const [isProcessed, setIsProcessed] = useState(false);

  // Check if user is the event host
  const isHost = user?.pubkey === event.pubkey;

  const handleCreateRSVP = async () => {
    if (!user || !isHost) return;

    try {
      const eventDTag = event.tags.find(([name]) => name === 'd')?.[1] || '';
      const dTag = `rsvp-${event.pubkey}:${eventDTag}-${comment.pubkey}`;

      const tags = [
        ['d', dTag],
        ['a', `31923:${event.pubkey}:${eventDTag}`], // Reference to event
        ['e', event.id], // Reference to specific event revision
        ['p', event.pubkey], // Event author
        ['p', comment.pubkey], // RSVP author
        ['status', rsvpStatus],
        ['e', comment.id, '', 'reply'], // Reference to the comment that triggered this RSVP
        ['created_by_host', 'true'], // Mark as created by host
      ];

      // Add free/busy status (only for accepted/tentative)
      if (rsvpStatus !== 'declined') {
        tags.push(['fb', 'busy']);
      }

      createEvent({
        kind: 31925, // Calendar Event RSVP (NIP-52)
        content: `RSVP created from discussion reply: "${comment.content.slice(0, 100)}${comment.content.length > 100 ? '...' : ''}"`,
        tags,
      });

      const statusEmojis = {
        accepted: '✅',
        tentative: '🤔',
        declined: '❌'
      };

      toast({
        title: `${statusEmojis[rsvpStatus]} RSVP Created!`,
        description: `Added ${author.data?.metadata?.name || 'user'} as ${rsvpStatus === 'accepted' ? 'going' : rsvpStatus === 'tentative' ? 'maybe' : 'not going'}`,
      });

      setIsProcessed(true);
    } catch (error) {
      console.error('Error creating RSVP:', error);
      toast({
        title: "Error",
        description: "Failed to create RSVP. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!isHost) return null;

  const statusConfig = {
    accepted: { variant: 'default' as const, emoji: '✅', text: 'Going', color: 'text-green-600' },
    tentative: { variant: 'secondary' as const, emoji: '🤔', text: 'Maybe', color: 'text-yellow-600' },
    declined: { variant: 'outline' as const, emoji: '❌', text: 'Not Going', color: 'text-red-600' },
  };

  const config = statusConfig[rsvpStatus];
  const displayName = author.data?.metadata?.name || author.data?.metadata?.display_name || 'Anonymous';

  return (
    <Card className="border-dashed border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className={config.color}>RSVP Detected</span>
          <Badge variant={config.variant} className="text-xs">
            {config.emoji} {config.text}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarImage src={author.data?.metadata?.picture} alt={displayName} />
              <AvatarFallback className="text-xs">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-sm">{displayName}</div>
              <div className="text-xs text-muted-foreground">
                "{comment.content.slice(0, 50)}{comment.content.length > 50 ? '...' : ''}"
              </div>
            </div>
          </div>

          {!isProcessed ? (
            <Button
              size="sm"
              onClick={handleCreateRSVP}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <UserPlus className="h-3 w-3 mr-1" />
              )}
              Add as Attendee
            </Button>
          ) : (
            <Badge variant="outline" className="text-xs">
              ✓ Added
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}