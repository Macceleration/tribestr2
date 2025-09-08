import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useToast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send, MessageCircle } from "lucide-react";

interface DMDialogProps {
  recipientPubkey: string;
  recipientName: string;
  children: React.ReactNode;
}

export function DMDialog({ recipientPubkey, recipientName, children }: DMDialogProps) {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = async () => {
    if (!user || !message.trim()) return;

    try {
      // Check if signer supports NIP-04 encryption
      if (!user.signer.nip04) {
        toast({
          title: "Encryption Not Supported",
          description: "Your signer doesn't support encrypted messages. Please upgrade your extension.",
          variant: "destructive",
        });
        return;
      }

      // Encrypt the message
      const encryptedContent = await user.signer.nip04.encrypt(recipientPubkey, message.trim());

      // Create the DM event (kind 4)
      createEvent({
        kind: 4,
        content: encryptedContent,
        tags: [
          ['p', recipientPubkey],
        ],
      });

      toast({
        title: "📨 Message Sent!",
        description: `Your encrypted message was sent to ${recipientName}`,
      });

      setMessage("");
      setIsOpen(false);

      // Navigate to chat page with this conversation
      navigate(`/messages?with=${recipientPubkey}`);
    } catch (error) {
      console.error('Error sending DM:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6 space-y-4">
            <p className="text-muted-foreground">
              Please log in to send direct messages
            </p>
            <Button onClick={() => navigate('/messages')} variant="outline">
              <MessageCircle className="h-4 w-4 mr-2" />
              Go to Messages
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Message to {recipientName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              🔒 This message will be encrypted using NIP-04 and only visible to you and {recipientName}.
            </p>
          </div>

          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => {
                setIsOpen(false);
                navigate(`/messages?with=${recipientPubkey}`);
              }}
              disabled={isPending}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Open Chat
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={isPending || !message.trim()}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send & Open Chat
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}