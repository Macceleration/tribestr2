import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useToast } from "@/hooks/useToast";
import { useNostr } from '@nostrify/react';
import type { NostrEvent } from "@nostrify/nostrify";

export function useJoinTribe() {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { toast } = useToast();

  const joinTribe = async (tribe: NostrEvent) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to join a tribe",
        variant: "destructive",
      });
      return;
    }

    try {
      const tribeName = tribe.tags.find(([name]) => name === 'name')?.[1] ||
                       tribe.tags.find(([name]) => name === 'd')?.[1] ||
                       'Tribe';

      const dTag = tribe.tags.find(([name]) => name === 'd')?.[1];
      if (!dTag) {
        throw new Error('Invalid tribe format');
      }

      const tribeId = `${tribe.pubkey}:${dTag}`;

      // Check if user is already a member
      const isAlreadyMember = tribe.tags.some(([name, pubkey]) =>
        name === 'p' && pubkey === user.pubkey
      );

      if (isAlreadyMember) {
        toast({
          title: "Already a Member",
          description: "You are already a member of this tribe",
          variant: "destructive",
        });
        return;
      }

      // Check if user has been rejected
      const rejections = await nostr.query([
        {
          kinds: [9022], // Join rejection
          '#h': [tribeId],
          '#p': [user.pubkey],
          limit: 5,
        }
      ], { signal: AbortSignal.timeout(1500) });

      if (rejections.length > 0) {
        toast({
          title: "Request Previously Rejected",
          description: "Your join request was rejected by the tribe admins",
          variant: "destructive",
        });
        return;
      }

      // Check for existing pending requests
      const existingRequests = await nostr.query([
        {
          kinds: [9021], // Join request
          '#h': [tribeId],
          authors: [user.pubkey],
          limit: 5,
        }
      ], { signal: AbortSignal.timeout(1500) });

      if (existingRequests.length > 0) {
        toast({
          title: "Request Already Pending",
          description: "You already have a pending join request for this tribe",
          variant: "destructive",
        });
        return;
      }

      // Check if tribe is open or closed
      const isOpen = tribe.tags.some(([name]) => name === 'open');

      if (!isOpen) {
        toast({
          title: "Tribe is Closed",
          description: "This tribe requires approval to join. Your request will be reviewed by admins.",
        });
      }

      // Send a join request event using NIP-29 format
      // This creates a join request that tribe admins can see and process
      createEvent({
        kind: 9021, // Join request (NIP-29)
        content: `Requesting to join ${tribeName}`,
        tags: [
          ['h', tribeId], // Group identifier
          ['p', tribe.pubkey], // Tribe creator
        ],
      });

      toast({
        title: "🎉 Join Request Sent!",
        description: `Your request to join ${tribeName} has been submitted.`,
      });

    } catch (error) {
      console.error('Error joining tribe:', error);
      toast({
        title: "Error",
        description: "Failed to join tribe. Please try again.",
        variant: "destructive",
      });
    }
  };

  return { joinTribe, isPending };
}