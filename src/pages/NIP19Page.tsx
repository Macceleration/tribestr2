import { nip19 } from 'nostr-tools';
import { useParams, Navigate } from 'react-router-dom';
import NotFound from './NotFound';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type } = decoded;

  switch (type) {
    case 'npub':
    case 'nprofile':
      // AI agent should implement profile view here
      return <div>Profile placeholder</div>;

    case 'note':
      // AI agent should implement note view here
      return <div>Note placeholder</div>;

    case 'nevent':
      // AI agent should implement event view here
      return <div>Event placeholder</div>;

    case 'naddr': {
      // Handle addressable events - redirect to appropriate page
      const naddr = decoded.data;
      const { kind, pubkey, identifier } = naddr;

      if (kind === 31923) {
        // Calendar event - redirect to event page
        return <Navigate to={`/event/${pubkey}:${identifier}`} replace />;
      } else if (kind === 34550) {
        // Community/tribe - redirect to tribe page
        return <Navigate to={`/tribe/${pubkey}:${identifier}`} replace />;
      } else {
        // Unknown addressable event kind
        return <div>Unsupported event type (kind {kind})</div>;
      }
    }

    default:
      return <NotFound />;
  }
}