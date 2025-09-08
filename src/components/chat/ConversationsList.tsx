import { useConversations } from "@/hooks/useDirectMessages";
import { useAuthor } from "@/hooks/useAuthor";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { genUserName } from "@/lib/genUserName";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConversationsListProps {
  selectedPubkey?: string;
  onSelectConversation: (pubkey: string) => void;
}

interface ConversationItemProps {
  pubkey: string;
  lastMessageAt: number;
  isSelected: boolean;
  onClick: () => void;
}

function ConversationItem({ pubkey, lastMessageAt, isSelected, onClick }: ConversationItemProps) {
  const { data: author } = useAuthor(pubkey);
  const metadata = author?.metadata;
  const displayName = metadata?.name || metadata?.display_name || genUserName(pubkey);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-colors hover:bg-muted/50",
        isSelected && "bg-muted border-primary"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={metadata?.picture} alt={displayName} />
            <AvatarFallback>
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium truncate">{displayName}</h4>
            <p className="text-sm text-muted-foreground">
              {new Date(lastMessageAt * 1000).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConversationsList({ selectedPubkey, onSelectConversation }: ConversationsListProps) {
  const { data: conversations, isLoading } = useConversations();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-4">
            <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No conversations yet</h3>
              <p className="text-muted-foreground text-sm">
                Start a conversation by visiting someone's profile and clicking "Message"
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.pubkey}
          pubkey={conversation.pubkey}
          lastMessageAt={conversation.lastMessageAt}
          isSelected={selectedPubkey === conversation.pubkey}
          onClick={() => onSelectConversation(conversation.pubkey)}
        />
      ))}
    </div>
  );
}