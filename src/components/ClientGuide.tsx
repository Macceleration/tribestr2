import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Smartphone, Zap } from "lucide-react";

export function ClientGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Using Tribes in Your Nostr Client
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="viewing" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="viewing">Viewing</TabsTrigger>
            <TabsTrigger value="participating">Participating</TabsTrigger>
            <TabsTrigger value="creating">Creating</TabsTrigger>
          </TabsList>

          <TabsContent value="viewing" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default">✅ Supported</Badge>
                <span className="text-sm">View tribes and events in timeline</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">✅ Supported</Badge>
                <span className="text-sm">See event details and descriptions</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">✅ Supported</Badge>
                <span className="text-sm">View badges in profiles</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Most Nostr clients can display tribe content natively using standard event kinds.
            </p>
          </TabsContent>

          <TabsContent value="participating" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="default">✅ Easy</Badge>
                <span className="text-sm">RSVP to events (publish kind 31925)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">🔧 Manual</Badge>
                <span className="text-sm">Check into events (publish kind 2073)</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">🌐 Web</Badge>
                <span className="text-sm">Join tribes (use web app)</span>
              </div>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-semibold text-sm mb-2">Check-in Instructions:</h4>
              <ol className="text-xs space-y-1 list-decimal list-inside">
                <li>Scan QR code to get 13-digit number</li>
                <li>Create custom event (kind 2073) with nonce tag</li>
                <li>Or use the web app check-in form</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="creating" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">🌐 Web Only</Badge>
                <span className="text-sm">Create tribes and events</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">🌐 Web Only</Badge>
                <span className="text-sm">Generate QR codes for check-ins</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">🌐 Web Only</Badge>
                <span className="text-sm">Manage tribe settings and members</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Advanced features require the web app for the best experience. Native client support is coming!
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">
                Pro Tip: Hybrid Usage
              </h4>
              <p className="text-xs text-blue-800 dark:text-blue-200">
                Use your favorite Nostr client for browsing and RSVPs, then switch to the web app for creating events and managing tribes. Both experiences work together seamlessly!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}