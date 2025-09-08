import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

// Hook to get events for a specific tribe
export function useTribeEvents(tribeId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['tribe-events', tribeId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      
      // Parse tribe coordinates
      const [pubkey, dTag] = tribeId.split(':');
      if (!pubkey || !dTag) return [];

      // Query for calendar events that reference this tribe
      const events = await nostr.query([
        {
          kinds: [31923], // Time-based calendar events (NIP-52)
          '#a': [`34550:${pubkey}:${dTag}`], // Reference to tribe
          limit: 100,
        }
      ], { signal });

      return events.filter(validateCalendarEvent);
    },
  });
}

// Hook to get a specific event
export function useEvent(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      
      // Parse event coordinates (format: pubkey:d-identifier)
      const [pubkey, dTag] = eventId.split(':');
      if (!pubkey || !dTag) {
        throw new Error('Invalid event ID format');
      }

      const events = await nostr.query([
        {
          kinds: [31923],
          authors: [pubkey],
          '#d': [dTag],
          limit: 1,
        }
      ], { signal });

      const event = events[0];
      return event && validateCalendarEvent(event) ? event : null;
    },
  });
}

// Hook to get RSVPs for an event
export function useEventRSVPs(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['event-rsvps', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      
      const [pubkey, dTag] = eventId.split(':');
      if (!pubkey || !dTag) return [];

      const events = await nostr.query([
        {
          kinds: [31925], // Calendar Event RSVP (NIP-52)
          '#a': [`31923:${pubkey}:${dTag}`],
          limit: 200,
        }
      ], { signal });

      return events.filter(validateRSVPEvent);
    },
  });
}

// Hook to get attendance verifications for an event
export function useEventAttendance(eventId: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['event-attendance', eventId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      
      const [pubkey, dTag] = eventId.split(':');
      if (!pubkey || !dTag) return [];

      const events = await nostr.query([
        {
          kinds: [2073], // Custom attendance verification kind
          '#a': [`31923:${pubkey}:${dTag}`],
          limit: 200,
        }
      ], { signal });

      return events.filter(validateAttendanceEvent);
    },
  });
}

// Hook to get user's RSVP for a specific event
export function useUserRSVP(eventId: string, userPubkey?: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['user-rsvp', eventId, userPubkey],
    queryFn: async (c) => {
      if (!userPubkey) return null;
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      
      const [pubkey, dTag] = eventId.split(':');
      if (!pubkey || !dTag) return null;

      const events = await nostr.query([
        {
          kinds: [31925],
          authors: [userPubkey],
          '#a': [`31923:${pubkey}:${dTag}`],
          limit: 1,
        }
      ], { signal });

      const rsvp = events[0];
      return rsvp && validateRSVPEvent(rsvp) ? rsvp : null;
    },
    enabled: !!userPubkey,
  });
}

// Validate calendar event structure
export function validateCalendarEvent(event: NostrEvent): boolean {
  if (event.kind !== 31923) return false;

  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
  const startTag = event.tags.find(([name]) => name === 'start')?.[1];

  if (!dTag || !titleTag || !startTag) return false;

  // Validate start timestamp
  const timestamp = parseInt(startTag);
  if (isNaN(timestamp) || timestamp <= 0) return false;

  return true;
}

// Validate RSVP event structure
export function validateRSVPEvent(event: NostrEvent): boolean {
  if (event.kind !== 31925) return false;

  const dTag = event.tags.find(([name]) => name === 'd')?.[1];
  const aTag = event.tags.find(([name]) => name === 'a')?.[1];
  const statusTag = event.tags.find(([name]) => name === 'status')?.[1];

  if (!dTag || !aTag || !statusTag) return false;
  if (!['accepted', 'declined', 'tentative'].includes(statusTag)) return false;

  return true;
}

// Validate attendance event structure
export function validateAttendanceEvent(event: NostrEvent): boolean {
  if (event.kind !== 2073) return false;

  const aTag = event.tags.find(([name]) => name === 'a')?.[1];
  const nonceTag = event.tags.find(([name]) => name === 'nonce')?.[1];
  const verifiedAtTag = event.tags.find(([name]) => name === 'verified_at')?.[1];

  if (!aTag || !nonceTag || !verifiedAtTag) return false;

  return true;
}