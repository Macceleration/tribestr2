import { useEffect, useCallback } from 'react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useNostrPublish } from './useNostrPublish';
import { useCurrentUser } from './useCurrentUser';
import { useToast } from './useToast';
import type { NostrEvent } from '@nostrify/nostrify';

export function useRSVPReplies(eventPubkey: string, eventDTag: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { toast } = useToast();

  // Query for replies to event announcement notes
  const { data: replies } = useQuery({
    queryKey: ['rsvp-replies', eventPubkey, eventDTag],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Look for kind 1 notes that reference this event
      const events = await nostr.query([{
        kinds: [1],
        '#a': [`31923:${eventPubkey}:${eventDTag}`],
        limit: 100,
      }], { signal });

      return events;
    },
    enabled: !!eventPubkey && !!eventDTag,
  });

  // Query for replies to those announcement notes
  const { data: replyEvents } = useQuery({
    queryKey: ['reply-events', replies?.map(r => r.id).join(',')],
    queryFn: async (c) => {
      if (!replies || replies.length === 0) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Get replies to announcement notes
      const replyEvents = await nostr.query([{
        kinds: [1],
        '#e': replies.map(r => r.id),
        limit: 200,
      }], { signal });

      return replyEvents;
    },
    enabled: !!replies && replies.length > 0,
  });

  // Function to detect RSVP status from reply content
  const detectRSVPStatus = useCallback((content: string): 'accepted' | 'tentative' | 'declined' | null => {
    const normalizedContent = content.toLowerCase().trim();

    // Check for positive responses
    if (normalizedContent.match(/\b(yes|going|accept|attending|count me in|i'll be there|👍|✅)\b/)) {
      return 'accepted';
    }

    // Check for maybe responses
    if (normalizedContent.match(/\b(maybe|might|tentative|possibly|not sure|🤔)\b/)) {
      return 'tentative';
    }

    // Check for negative responses
    if (normalizedContent.match(/\b(no|not going|decline|can't|cannot|won't|unable|❌)\b/)) {
      return 'declined';
    }

    return null;
  }, []);

  // Process replies to detect and convert RSVPs
  useEffect(() => {
    if (!replyEvents || !user) return;

    // Function to convert reply to RSVP
    const convertReplyToRSVP = async (reply: NostrEvent, status: 'accepted' | 'tentative' | 'declined') => {
      if (!user || reply.pubkey !== user.pubkey) return;

      try {
        // Generate unique identifier for RSVP
        const dTag = `rsvp-${eventPubkey}:${eventDTag}-${user.pubkey}`;

        const tags = [
          ['d', dTag],
          ['a', `31923:${eventPubkey}:${eventDTag}`], // Reference to event
          ['p', eventPubkey], // Event author
          ['status', status],
          ['e', reply.id], // Reference to the reply that triggered this RSVP
        ];

        // Add free/busy status (only for accepted/tentative)
        if (status !== 'declined') {
          tags.push(['fb', 'busy']);
        }

        createEvent({
          kind: 31925, // Calendar Event RSVP (NIP-52)
          content: reply.content,
          tags,
        });

        const statusEmojis = {
          accepted: '✅',
          tentative: '🤔',
          declined: '❌'
        };

        toast({
          title: `${statusEmojis[status]} RSVP Created!`,
          description: `Your reply has been converted to a proper RSVP: ${status === 'accepted' ? 'Going' : status === 'tentative' ? 'Maybe' : 'Not Going'}`,
        });
      } catch (error) {
        console.error('Error converting reply to RSVP:', error);
      }
    };

    // Find user's replies that look like RSVPs
    const userReplies = replyEvents.filter(reply => reply.pubkey === user.pubkey);

    for (const reply of userReplies) {
      const status = detectRSVPStatus(reply.content);
      if (status) {
        // Check if we already have an RSVP for this event from this user
        // This is a simple check - in a real implementation you'd want to query for existing RSVPs
        const hasExistingRSVP = false; // TODO: Query for existing RSVP events

        if (!hasExistingRSVP) {
          convertReplyToRSVP(reply, status);
        }
      }
    }
  }, [replyEvents, user, eventPubkey, eventDTag, createEvent, toast, detectRSVPStatus]);

  return {
    replies: replyEvents || [],
    detectRSVPStatus,
  };
}