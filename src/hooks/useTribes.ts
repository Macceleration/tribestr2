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

// Validate tribe event structure
export function validateTribeEvent(event: NostrEvent): boolean {
  if (event.kind !== 34550) return false;

  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  const _nameTag = event.tags.find(([name]) => name === 'name')?.[1];

  // Must have d tag and either name tag or use d tag as name
  if (!dTag) return false;

  return true;
}