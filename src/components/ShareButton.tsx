import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/useToast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { Share2, Copy, Check, Send, Loader2 } from "lucide-react";
import QRCode from "qrcode";
import type { NostrShareLinks } from "@/lib/nostrLinks";

interface ShareButtonProps {
  links: NostrShareLinks;
  title: string;
  children?: React.ReactNode;
  // Optional props for creating announcement notes
  isEvent?: boolean;
  eventDetails?: string;
  pubkey?: string;
  dTag?: string;
}

export function ShareButton({ links, title, children, isEvent, eventDetails, pubkey, dTag }: ShareButtonProps) {
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isPublishing } = useNostrPublish();
  const [open, setOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<{
    web: string;
    nostr: string;
    text: string;
  }>({ web: "", nostr: "", text: "" });

  // Generate QR codes when dialog opens
  useEffect(() => {
    if (open) {
      const generateQRCodes = async () => {
        try {
          const [webQR, nostrQR, textQR] = await Promise.all([
            QRCode.toDataURL(links.web, { width: 200, margin: 2 }),
            QRCode.toDataURL(`nostr:${links.naddr}`, { width: 200, margin: 2 }),
            QRCode.toDataURL(links.text, { width: 200, margin: 2 }),
          ]);
          setQrCodes({ web: webQR, nostr: nostrQR, text: textQR });
        } catch (error) {
          console.error("Failed to generate QR codes:", error);
        }
      };
      generateQRCodes();
    }
  }, [open, links]);

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
      toast({
        title: "Copied!",
        description: `${field} copied to clipboard`,
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator && navigator.share) {
      try {
        await navigator.share({
          title,
          text: links.text,
          url: links.web,
        });
      } catch {
        // User cancelled or error occurred
      }
    }
  };

  const handlePublishAnnouncement = async () => {
    if (!user || !pubkey || !dTag) {
      toast({
        title: "Error",
        description: "You must be logged in to publish an announcement",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEvent) {
        // Create event announcement note
        const content = `📅 ${title}

${eventDetails || 'Join us for this event!'}

RSVP here: ${links.web}

Reply with "yes", "no", or "maybe" to RSVP quickly!

#event #calendar`;

        createEvent({
          kind: 1,
          content,
          tags: [
            ['a', `31923:${pubkey}:${dTag}`],
            ['t', 'event'],
            ['t', 'calendar'],
            ['r', links.web],
            ['alt', `Event announcement: ${title}`],
          ],
        });
      } else {
        // Create tribe announcement note
        const content = `🏛️ Join the ${title} tribe!

${eventDetails || 'A great community to be part of!'}

Join here: ${links.web}

#tribe #community`;

        createEvent({
          kind: 1,
          content,
          tags: [
            ['a', `34550:${pubkey}:${dTag}`],
            ['t', 'tribe'],
            ['t', 'community'],
            ['r', links.web],
            ['alt', `Tribe invitation: ${title}`],
          ],
        });
      }

      toast({
        title: "Announcement Published!",
        description: "Your announcement note has been published to your followers",
      });

      setOpen(false);
    } catch (error) {
      console.error('Error publishing announcement:', error);
      toast({
        title: "Error",
        description: "Failed to publish announcement. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share {title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button onClick={handleNativeShare} className="w-full">
              <Share2 className="h-4 w-4 mr-2" />
              Share via System
            </Button>
          )}

          {user && pubkey && dTag && (
            <>
              <Button
                onClick={handlePublishAnnouncement}
                className="w-full"
                variant="outline"
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Publish Announcement Note
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Creates a note your followers can see and reply to for better client compatibility
              </p>
              <Separator />
            </>
          )}

          <Tabs defaultValue="web" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="web">Web Link</TabsTrigger>
              <TabsTrigger value="nostr">Nostr Link</TabsTrigger>
              <TabsTrigger value="text">Text</TabsTrigger>
            </TabsList>

            <TabsContent value="web" className="space-y-4">
              <Label htmlFor="web-link">Web Browser Link</Label>
              <div className="flex gap-2">
                <Input
                  id="web-link"
                  value={links.web}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(links.web, "Web link")}
                >
                  {copiedField === "Web link" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {qrCodes.web && (
                <div className="flex justify-center">
                  <img
                    src={qrCodes.web}
                    alt="QR code for web link"
                    className="border rounded-lg"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Works in any browser, full features available
              </p>
            </TabsContent>

            <TabsContent value="nostr" className="space-y-4">
              <Label htmlFor="nostr-link">Nostr Client Link</Label>
              <div className="flex gap-2">
                <Input
                  id="nostr-link"
                  value={`nostr:${links.naddr}`}
                  readOnly
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(`nostr:${links.naddr}`, "Nostr link")}
                >
                  {copiedField === "Nostr link" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {qrCodes.nostr && (
                <div className="flex justify-center">
                  <img
                    src={qrCodes.nostr}
                    alt="QR code for Nostr link"
                    className="border rounded-lg"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Opens directly in Nostr clients like Damus, Amethyst. If the link doesn't work in your client, try the web link instead.
              </p>
            </TabsContent>

            <TabsContent value="text" className="space-y-4">
              <Label htmlFor="share-text">Share Text</Label>
              <div className="flex gap-2">
                <Input
                  id="share-text"
                  value={links.text}
                  readOnly
                  className="flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(links.text, "Share text")}
                >
                  {copiedField === "Share text" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {qrCodes.text && (
                <div className="flex justify-center">
                  <img
                    src={qrCodes.text}
                    alt="QR code for share text"
                    className="border rounded-lg"
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Includes both web and Nostr links for maximum compatibility
              </p>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}