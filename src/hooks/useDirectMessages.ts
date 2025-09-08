import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from '@/hooks/useCurrentUser';

export interface DecryptedMessage {
  id: string;
  content: string;
  created_at: number;
  sender: string;
  recipient: string;
  isFromMe: boolean;
  decryptError?: boolean;
}

export function useDirectMessages(otherUserPubkey?: string) {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['direct-messages', user?.pubkey, otherUserPubkey],
    queryFn: async (c) => {
      if (!user?.pubkey || !otherUserPubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      // Query for DMs between the two users
      const events = await nostr.query([
        {
          kinds: [4], // Encrypted Direct Messages
          authors: [user.pubkey, otherUserPubkey],
          '#p': [user.pubkey, otherUserPubkey],
          limit: 100,
        }
      ], { signal });

      // Filter messages between these specific users
      const relevantMessages = events.filter(event => {
        const recipientTag = event.tags.find(([name]) => name === 'p')?.[1];
        return (
          (event.pubkey === user.pubkey && recipientTag === otherUserPubkey) ||
          (event.pubkey === otherUserPubkey && recipientTag === user.pubkey)
        );
      });

      // Decrypt messages
      const decryptedMessages: DecryptedMessage[] = [];

      for (const event of relevantMessages) {
        try {
          let decryptedContent: string;

          if (event.pubkey === user.pubkey) {
            // Message sent by current user
            if (user.signer.nip04) {
              decryptedContent = await user.signer.nip04.decrypt(otherUserPubkey, event.content);
            } else {
              decryptedContent = '[Decryption not supported]';
            }
          } else {
            // Message received from other user
            if (user.signer.nip04) {
              decryptedContent = await user.signer.nip04.decrypt(event.pubkey, event.content);
            } else {
              decryptedContent = '[Decryption not supported]';
            }
          }

          const recipientTag = event.tags.find(([name]) => name === 'p')?.[1];

          decryptedMessages.push({
            id: event.id,
            content: decryptedContent,
            created_at: event.created_at,
            sender: event.pubkey,
            recipient: recipientTag || '',
            isFromMe: event.pubkey === user.pubkey,
          });
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          const recipientTag = event.tags.find(([name]) => name === 'p')?.[1];

          decryptedMessages.push({
            id: event.id,
            content: '[Failed to decrypt message]',
            created_at: event.created_at,
            sender: event.pubkey,
            recipient: recipientTag || '',
            isFromMe: event.pubkey === user.pubkey,
            decryptError: true,
          });
        }
      }

      // Sort by timestamp (oldest first for chat display)
      return decryptedMessages.sort((a, b) => a.created_at - b.created_at);
    },
    enabled: !!user?.pubkey && !!otherUserPubkey,
    refetchInterval: 5000, // Refetch every 5 seconds for new messages
  });
}

// Hook to get all conversations (unique users the current user has messaged with)
export function useConversations() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  return useQuery({
    queryKey: ['conversations', user?.pubkey],
    queryFn: async (c) => {
      if (!user?.pubkey) return [];

      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);

      // Get all DMs involving the current user
      const events = await nostr.query([
        {
          kinds: [4],
          authors: [user.pubkey],
          limit: 200,
        },
        {
          kinds: [4],
          '#p': [user.pubkey],
          limit: 200,
        }
      ], { signal });

      // Extract unique conversation partners
      const conversationPartners = new Set<string>();

      events.forEach(event => {
        if (event.pubkey === user.pubkey) {
          // Message sent by current user - get recipient
          const recipient = event.tags.find(([name]) => name === 'p')?.[1];
          if (recipient) conversationPartners.add(recipient);
        } else {
          // Message received by current user - get sender
          conversationPartners.add(event.pubkey);
        }
      });

      // Get the latest message timestamp for each conversation
      const conversations = Array.from(conversationPartners).map(pubkey => {
        const conversationMessages = events.filter(event => {
          const recipientTag = event.tags.find(([name]) => name === 'p')?.[1];
          return (
            (event.pubkey === user.pubkey && recipientTag === pubkey) ||
            (event.pubkey === pubkey && recipientTag === user.pubkey)
          );
        });

        const latestMessage = conversationMessages.reduce((latest, current) =>
          current.created_at > latest.created_at ? current : latest
        );

        return {
          pubkey,
          lastMessageAt: latestMessage.created_at,
          lastMessageId: latestMessage.id,
        };
      });

      // Sort by most recent message
      return conversations.sort((a, b) => b.lastMessageAt - a.lastMessageAt);
    },
    enabled: !!user?.pubkey,
    refetchInterval: 10000, // Refetch every 10 seconds for new conversations
  });
}