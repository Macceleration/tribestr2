import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useToast } from "@/hooks/useToast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Zap, ExternalLink } from "lucide-react";

interface ProfileZapDialogProps {
  recipientPubkey: string;
  recipientName: string;
  recipientLud16?: string;
  children: React.ReactNode;
}

export function ProfileZapDialog({
  recipientPubkey,
  recipientName,
  recipientLud16,
  children
}: ProfileZapDialogProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const [amount, setAmount] = useState("21");
  const [comment, setComment] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoice, setInvoice] = useState<string | null>(null);

  const handleZap = async () => {
    if (!user || !amount || !recipientLud16) return;

    setIsProcessing(true);
    try {
      const sats = parseInt(amount);
      if (isNaN(sats) || sats <= 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid number of sats",
          variant: "destructive",
        });
        return;
      }

      // Convert lightning address to LNURL
      const [name, domain] = recipientLud16.split('@');
      if (!name || !domain) {
        toast({
          title: "Invalid Lightning Address",
          description: "The recipient's lightning address is not valid",
          variant: "destructive",
        });
        return;
      }

      // Get LNURL pay endpoint
      const lnurlResponse = await fetch(`https://${domain}/.well-known/lnurlp/${name}`);
      if (!lnurlResponse.ok) {
        throw new Error('Failed to fetch LNURL endpoint');
      }

      const lnurlData = await lnurlResponse.json();

      if (!lnurlData.allowsNostr || !lnurlData.nostrPubkey) {
        toast({
          title: "Zaps Not Supported",
          description: "This lightning address doesn't support Nostr zaps",
          variant: "destructive",
        });
        return;
      }

      const millisats = sats * 1000;
      if (millisats < lnurlData.minSendable || millisats > lnurlData.maxSendable) {
        toast({
          title: "Amount Out of Range",
          description: `Amount must be between ${lnurlData.minSendable / 1000} and ${lnurlData.maxSendable / 1000} sats`,
          variant: "destructive",
        });
        return;
      }

      // Create zap request event (kind 9734)
      const zapRequest = {
        kind: 9734,
        content: comment.trim(),
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['relays', 'wss://relay.nostr.band'], // Add current relay
          ['amount', millisats.toString()],
          ['lnurl', recipientLud16],
          ['p', recipientPubkey],
        ],
      };

      // Sign the zap request
      const signedZapRequest = await user.signer.signEvent(zapRequest);

      // Send to callback URL
      const encodedZapRequest = encodeURIComponent(JSON.stringify(signedZapRequest));
      const callbackUrl = `${lnurlData.callback}?amount=${millisats}&nostr=${encodedZapRequest}&lnurl=${recipientLud16}`;

      const invoiceResponse = await fetch(callbackUrl);
      if (!invoiceResponse.ok) {
        throw new Error('Failed to get invoice');
      }

      const invoiceData = await invoiceResponse.json();
      if (!invoiceData.pr) {
        throw new Error('No invoice received');
      }

      setInvoice(invoiceData.pr);

      toast({
        title: "⚡ Invoice Generated!",
        description: "Pay the invoice to complete your zap",
      });

    } catch (error) {
      console.error('Error creating zap:', error);
      toast({
        title: "Error",
        description: "Failed to create zap invoice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyInvoice = () => {
    if (invoice) {
      navigator.clipboard.writeText(invoice);
      toast({
        title: "Copied!",
        description: "Invoice copied to clipboard",
      });
    }
  };

  const handleOpenInWallet = () => {
    if (invoice) {
      window.open(`lightning:${invoice}`, '_blank');
    }
  };

  const resetDialog = () => {
    setAmount("21");
    setComment("");
    setInvoice(null);
    setIsOpen(false);
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
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Please log in to send zaps
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!recipientLud16) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zaps Not Available</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              {recipientName} hasn't set up a lightning address for receiving zaps
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        // Reset when closing
        setTimeout(resetDialog, 300);
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Zap {recipientName}
          </DialogTitle>
        </DialogHeader>

        {!invoice ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (sats)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="21"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comment (optional)</Label>
              <Textarea
                id="comment"
                placeholder="Great post! ⚡"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                ⚡ Lightning address: {recipientLud16}
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleZap}
                disabled={isProcessing || !amount}
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                Create Zap
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-4xl mb-2">⚡</div>
              <h3 className="text-lg font-semibold">Invoice Ready!</h3>
              <p className="text-muted-foreground">
                Pay this invoice to complete your {amount} sat zap
              </p>
            </div>

            <div className="space-y-2">
              <Label>Lightning Invoice</Label>
              <div className="p-3 bg-muted rounded-lg">
                <code className="text-xs break-all">{invoice}</code>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCopyInvoice}
                className="flex-1"
              >
                Copy Invoice
              </Button>
              <Button
                onClick={handleOpenInWallet}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Wallet
              </Button>
            </div>

            <Button
              variant="ghost"
              onClick={resetDialog}
              className="w-full"
            >
              Create Another Zap
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}