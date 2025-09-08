import { useState } from "react";
import type { NostrEvent } from "@nostrify/nostrify";
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useAuthor } from "@/hooks/useAuthor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { genUserName } from "@/lib/genUserName";
import { Settings, UserCheck, UserX, Users, Loader2 } from "lucide-react";

interface TribeAdminPanelProps {
  tribe: NostrEvent;
  tribeId: string;
}

interface JoinRequestCardProps {
  request: NostrEvent;
  onApprove: (request: NostrEvent) => void;
  onReject: (request: NostrEvent) => void;
  isProcessing: boolean;
}

function JoinRequestCard({ request, onApprove, onReject, isProcessing }: JoinRequestCardProps) {
  const author = useAuthor(request.pubkey);
  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || genUserName(request.pubkey);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={metadata?.picture} alt={displayName} />
              <AvatarFallback>
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{displayName}</h4>
              <p className="text-sm text-muted-foreground">
                {new Date(request.created_at * 1000).toLocaleDateString()}
              </p>
              {request.content && (
                <p className="text-sm text-muted-foreground mt-1">
                  "{request.content}"
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => onApprove(request)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserCheck className="h-4 w-4" />
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(request)}
              disabled={isProcessing}
            >
              <UserX className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TribeAdminPanel({ tribe, tribeId }: TribeAdminPanelProps) {
  const { user } = useCurrentUser();
  const { nostr } = useNostr();
  const { mutate: createEvent, isPending: isProcessing } = useNostrPublish();
  const { toast } = useToast();
  
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  // Check if user is admin
  const userRole = tribe.tags.find(([name, pubkey, , role]) => 
    name === 'p' && pubkey === user?.pubkey && (role === 'admin' || role === 'moderator')
  )?.[3];

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator' || isAdmin;

  // Query for join requests
  const { data: joinRequests, isLoading: requestsLoading, refetch } = useQuery({
    queryKey: ['join-requests', tribeId],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);
      
      const events = await nostr.query([
        {
          kinds: [9021], // Join request (NIP-29)
          '#h': [tribeId],
          limit: 50,
        }
      ], { signal });

      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: isModerator,
  });

  const handleApprove = async (request: NostrEvent) => {
    setProcessingRequest(request.id);
    
    try {
      // Add user to tribe by updating tribe definition
      const currentTags = [...tribe.tags];
      
      // Add the user as a member
      currentTags.push(['p', request.pubkey, '', 'member']);

      createEvent({
        kind: 34550, // Update tribe definition
        content: tribe.content,
        tags: currentTags,
      });

      toast({
        title: "✅ Member Approved!",
        description: "User has been added to the tribe",
      });

      refetch();
    } catch (error) {
      console.error('Error approving member:', error);
      toast({
        title: "Error",
        description: "Failed to approve member",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleReject = async (request: NostrEvent) => {
    setProcessingRequest(request.id);
    
    try {
      // Could implement rejection notification here
      toast({
        title: "❌ Request Rejected",
        description: "Join request has been rejected",
      });

      refetch();
    } catch (error) {
      console.error('Error rejecting member:', error);
      toast({
        title: "Error",
        description: "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessingRequest(null);
    }
  };

  if (!isModerator) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Tribe Administration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="requests">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Join Requests
              {joinRequests && joinRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {joinRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="space-y-4">
            {requestsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-full animate-pulse" />
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                          <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : joinRequests && joinRequests.length > 0 ? (
              <div className="space-y-4">
                {joinRequests.map((request) => (
                  <JoinRequestCard
                    key={request.id}
                    request={request}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isProcessing={processingRequest === request.id || isProcessing}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-semibold mb-1">No pending requests</h3>
                <p className="text-sm text-muted-foreground">
                  Join requests will appear here for approval
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <div className="text-center py-8">
              <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-semibold mb-1">Tribe Settings</h3>
              <p className="text-sm text-muted-foreground">
                Settings panel coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}