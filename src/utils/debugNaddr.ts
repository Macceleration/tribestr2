import { nip19 } from 'nostr-tools';

// Utility function to debug naddr links
export function debugNaddr(naddr: string) {
  try {
    const decoded = nip19.decode(naddr);
    if (decoded.type === 'naddr') {
      const { kind, pubkey, identifier } = decoded.data;
      console.log('Decoded naddr:', {
        type: decoded.type,
        kind,
        pubkey: pubkey.slice(0, 8) + '...',
        identifier,
        expectedEventCoord: `${kind}:${pubkey}:${identifier}`
      });
      return decoded.data;
    }
  } catch (error) {
    console.error('Failed to decode naddr:', error);
  }
  return null;
}

// Test function you can call from browser console
declare global {
  interface Window {
    debugNaddr: typeof debugNaddr;
  }
}

if (typeof window !== 'undefined') {
  window.debugNaddr = debugNaddr;
}