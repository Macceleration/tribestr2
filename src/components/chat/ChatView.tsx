import { useState, useRef, useEffect } from "react";
import { useDirectMessages } from "@/hooks/useDirectMessages";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useAuthor } from "@/hooks/useAuthor";
import { useToast } from "@/hooks/useToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { genUserName } from "@/lib/genUserName";
import { Send, Loader2, Lock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatViewProps {
  otherUserPubkey: string;
}

export function ChatView({ otherUserPubkey }: ChatViewProps) {
  const { user } = useCurrentUser();
  const { data: messages, isLoading, refetch } = useDirectMessages(otherUserPubkey);
  const { data: otherUser } = useAuthor(otherUserPubkey);
  const { mutate: createEvent, isPending: isSending } = useNostrPublish();
  const { toast } = useToast();
  
  const [newMessage, setNewMessage] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUserMetadata = otherUser?.metadata;
  const otherUserName = otherUserMetadata?.name || otherUserMetadata?.display_name || genUserName(otherUserPubkey);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user || !newMessage.trim()) return;

    try {
      if (!user.signer.nip04) {
        toast({
          title: "Encryption Not Supported",
          description: "Your signer doesn't support encrypted messages",
          variant: "destructive",
        });
        return;
      }

      const encryptedContent = await user.signer.nip04.encrypt(otherUserPubkey, newMessage.trim());

      createEvent({
        kind: 4,
        content: encryptedContent,
        tags: [['p', otherUserPubkey]],
      });

      setNewMessage("");
      
      // Refetch messages after a short delay to show the new message
      setTimeout(() => {
        refetch();
      }, 1000);

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 px-8 text-center">
          <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Login Required</h3>
          <p className="text-muted-foreground">
            Please log in to access your messages
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col h-[600px] max-w-2xl mx-auto">
      {/* Chat Header */}
      <Card className="rounded-b-none border-b-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={otherUserMetadata?.picture} alt={otherUserName} />
              <AvatarFallback>
                {otherUserName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{otherUserName}</h3>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                <span>End-to-end encrypted</span>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Messages Area */}
      <Card className="flex-1 rounded-none border-b-0">
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className={cn("flex", i % 2 === 0 ? "justify-end" : "justify-start")}>
                    <div className="space-y-2 max-w-xs">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-16 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : messages && messages.length > 0 ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.isFromMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-xs lg:max-w-md px-4 py-2 rounded-lg",
                        message.isFromMe
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted",
                        message.decryptError && "border border-destructive"
                      )}
                    >
                      {message.decryptError && (
                        <div className="flex items-center gap-1 text-destructive mb-1">
                          <AlertCircle className="h-3 w-3" />
                          <span className="text-xs">Decryption failed</span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <p
                        className={cn(
                          "text-xs mt-1",
                          message.isFromMe
                            ? "text-primary-foreground/70"
                            : "text-muted-foreground"
                        )}
                      >
                        {new Date(message.created_at * 1000).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                  <p className="text-muted-foreground">
                    Send a message to begin your encrypted chat with {otherUserName}
                  </p>
                </div>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Message Input */}
      <Card className="rounded-t-none">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button
              onClick={handleSendMessage}
              disabled={isSending || !newMessage.trim()}
              size="sm"
              className="self-end"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </CardContent>
      </Card>
    </div>
  );
}