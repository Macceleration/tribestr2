import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

// Hook to get tribes (communities) that the user belongs to
export function useMyTribes(pubkey?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['my-tribes', pubkey],
    queryFn: async (c) => {
      if (!pubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);

      // Query for community definitions where user is a moderator/member
      const events = await nostr.query([
        {
          kinds: [34550], // Community Definition (NIP-72)
          '#p': [pubkey],
          limit: 50,
        }
      ], { signal });

      return events;
    },
    enabled: !!pubkey,
  });
}

// Hook to get all public tribes
export function usePublicTribes() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['public-tribes'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);

      const events = await nostr.query([
        {
          kinds: [34550], // Community Definition (NIP-72)
          '#t': ['tribe'], // Filter for tribe communities
          limit: 50,
        }
      ], { signal });

      return events;
    },
  });
}

// Hook to get a specific tribe by its coordinates
export function useTribe(tribeId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['tribe', tribeId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);

      // Parse tribe coordinates (format: pubkey:d-identifier)
      const [pubkey, dTag] = tribeId.split(':');
      if (!pubkey || !dTag) {
        throw new Error('Invalid tribe ID format');
      }

      const events = await nostr.query([
        {
          kinds: [34550],
          authors: [pubkey],
          '#d': [dTag],
          limit: 1,
        }
      ], { signal });

      return events[0] || null;
    },
  });
}

// Hook to get join requests for a tribe (for checking if user already requested)
export function useTribeJoinRequests(tribeId: string, userPubkey?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['tribe-join-requests', tribeId, userPubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);

      const filter: {
        kinds: number[];
        '#h': string[];
        limit: number;
        authors?: string[];
      } = {
        kinds: [9021], // Join request (NIP-29)
        '#h': [tribeId],
        limit: 100,
      };

      // If checking for specific user, filter by author
      if (userPubkey) {
        filter.authors = [userPubkey];
      }

      // Get join requests and rejections
      const [requests, rejections] = await Promise.all([
        nostr.query([filter], { signal }),
        nostr.query([
          {
            kinds: [9022], // Join rejection (custom kind)
            '#h': [tribeId],
            authors: userPubkey ? [userPubkey] : undefined,
            '#p': userPubkey ? [userPubkey] : undefined,
            limit: 10,
          }
        ], { signal })
      ]);

      // If user has been rejected, don't show any pending requests
      if (userPubkey && rejections.length > 0) {
        return [];
      }

      return requests.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: !!tribeId,
  });
}

// Hook to get member count for a tribe by fetching fresh data
export function useTribeMemberCount(tribeId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['tribe-member-count', tribeId],
    queryFn: async (c) => {
      if (!tribeId) return 0;

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);

      // Parse tribe coordinates (format: pubkey:d-identifier)
      const [pubkey, dTag] = tribeId.split(':');
      if (!pubkey || !dTag) {
        return 0;
      }

      const events = await nostr.query([
        {
          kinds: [34550],
          authors: [pubkey],
          '#d': [dTag],
          limit: 1,
        }
      ], { signal });

      const tribe = events[0];
      if (!tribe) return 0;

      return getUniqueMemberCount(tribe);
    },
    enabled: !!tribeId,
    staleTime: 30000, // Cache for 30 seconds
  });
}

// Helper function to count unique members from p tags
function getUniqueMemberCount(tribe: NostrEvent): number {
  const memberPubkeys = new Set();

  // Count unique pubkeys from p tags (members, moderators, admins, etc.)
  tribe.tags.forEach(([name, pubkey]) => {
    if (name === 'p' && pubkey) {
      memberPubkeys.add(pubkey);
    }
  });

  return memberPubkeys.size;
}

// Validate tribe event structure
export function validateTribeEvent(event: NostrEvent): boolean {
  if (event.kind !== 34550) return false;

  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  const _nameTag = event.tags.find(([name]) => name === 'name')?.[1];

  // Must have d tag and either name tag or use d tag as name
  if (!dTag) return false;

  return true;
}