# Tribe Events Extension

## Summary

This document defines custom event kinds used by the Tribe app to extend existing Nostr NIPs for community-based event management with attendance verification.

## Custom Event Kinds

### Kind 2073: Attendance Verification

An attendance verification event is used to prove physical presence at a tribe event. These events are generated when a user successfully scans a 13-digit QR code provided by the event host and enters the code in their Nostr client.

#### Tags

- `a` (required): Coordinates to the calendar event being attended (kind 31923)
- `e` (optional): Event ID of the specific calendar event revision
- `p` (required): Pubkey of the event host who generated the verification code
- `nonce` (required): 13-digit verification code from the QR scan (format: 10-digit timestamp + 3-digit random)
- `location` (optional): Location where verification occurred
- `verified_at` (required): Unix timestamp when verification occurred

#### Example

```json
{
  "kind": 2073,
  "content": "Verified attendance at Vibe Coders Meetup #3",
  "tags": [
    ["a", "31923:host-pubkey:meetup-3", "wss://relay.example.com"],
    ["e", "event-id-hex"],
    ["p", "host-pubkey-hex"],
    ["nonce", "1693526400123"],
    ["location", "Tech Hub Downtown"],
    ["verified_at", "1693526400"],
    ["alt", "Attendance verification for tribe event"]
  ]
}
```

## Integration with Existing NIPs

This custom kind integrates with the following established NIPs:

- **NIP-52**: Calendar events (kind 31923) for tribe events and RSVP (kind 31925)
- **NIP-58**: Badge system (kinds 8, 30008, 30009) for attendance badges
- **NIP-72**: Moderated communities (kind 34550) for tribe definitions

## Badge Issuance Flow

1. User attends tribe event and scans 13-digit QR code
2. User enters the code in their Nostr client to check-in
3. Attendance verification event (kind 2073) is published
4. Automated badge award event (kind 8) is issued by tribe
5. User can display badge in their profile badges (kind 30008)