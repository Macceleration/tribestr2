import { nip19 } from 'nostr-tools';

export interface NostrShareLinks {
  web: string;
  naddr: string;
  nevent?: string; // For better client compatibility
  text: string;
}

export function createTribeShareLinks(tribePubkey: string, dTag: string, tribeName: string): NostrShareLinks {
  const naddr = nip19.naddrEncode({
    kind: 34550,
    pubkey: tribePubkey,
    identifier: dTag,
  });

  const webUrl = `${window.location.origin}/tribe/${tribePubkey}:${dTag}`;

  return {
    web: webUrl,
    naddr,
    text: `Join the ${tribeName} tribe! ${webUrl} or nostr:${naddr}`,
  };
}

export function createEventShareLinks(eventPubkey: string, dTag: string, eventTitle: string): NostrShareLinks {
  const naddr = nip19.naddrEncode({
    kind: 31923,
    pubkey: eventPubkey,
    identifier: dTag,
  });

  const webUrl = `${window.location.origin}/event/${eventPubkey}:${dTag}`;

  return {
    web: webUrl,
    naddr,
    text: `RSVP for ${eventTitle}! ${webUrl} or nostr:${naddr}`,
  };
}

export function createCheckInEvent(eventCoords: string, qrCode: string, location?: string) {
  return {
    kind: 2073,
    content: `Checked in with code: ${qrCode}`,
    tags: [
      ['a', eventCoords],
      ['nonce', qrCode],
      ['verified_at', Math.floor(Date.now() / 1000).toString()],
      ...(location ? [['location', location]] : []),
      ['alt', 'Attendance verification for tribe event'],
    ],
  };
}

export function createEventAnnouncementNote(eventPubkey: string, dTag: string, eventTitle: string, eventDetails: string) {
  const naddr = nip19.naddrEncode({
    kind: 31923,
    pubkey: eventPubkey,
    identifier: dTag,
  });

  const webUrl = `${window.location.origin}/event/${eventPubkey}:${dTag}`;

  return {
    kind: 1,
    content: `📅 ${eventTitle}

${eventDetails}

RSVP here: ${webUrl}

#event #calendar nostr:${naddr}`,
    tags: [
      ['a', `31923:${eventPubkey}:${dTag}`],
      ['t', 'event'],
      ['t', 'calendar'],
      ['r', webUrl],
      ['alt', `Event announcement: ${eventTitle}`],
    ],
  };
}

export function createTribeAnnouncementNote(tribePubkey: string, dTag: string, tribeName: string, tribeDescription: string) {
  const naddr = nip19.naddrEncode({
    kind: 34550,
    pubkey: tribePubkey,
    identifier: dTag,
  });

  const webUrl = `${window.location.origin}/tribe/${tribePubkey}:${dTag}`;

  return {
    kind: 1,
    content: `🏛️ Join the ${tribeName} tribe!

${tribeDescription}

Join here: ${webUrl}

#tribe #community nostr:${naddr}`,
    tags: [
      ['a', `34550:${tribePubkey}:${dTag}`],
      ['t', 'tribe'],
      ['t', 'community'],
      ['r', webUrl],
      ['alt', `Tribe invitation: ${tribeName}`],
    ],
  };
}