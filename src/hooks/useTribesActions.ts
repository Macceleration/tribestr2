import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useToast } from "@/hooks/useToast";
import type { NostrEvent } from "@nostrify/nostrify";

export function useJoinTribe() {
  const { user } = useCurrentUser();
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

      // Check if tribe is open or closed
      const isOpen = tribe.tags.some(([name]) => name === 'open');

      if (!isOpen) {
        toast({
          title: "Tribe is Closed",
          description: "This tribe requires approval to join. Contact the admins.",
          variant: "destructive",
        });
        return;
      }

      // Send a join request event using NIP-29 format
      // This creates a join request that tribe admins can see and process

      const dTag = tribe.tags.find(([name]) => name === 'd')?.[1];
      if (!dTag) {
        throw new Error('Invalid tribe format');
      }

      createEvent({
        kind: 9021, // Join request (NIP-29)
        content: `Requesting to join ${tribeName}`,
        tags: [
          ['h', `${tribe.pubkey}:${dTag}`], // Group identifier
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