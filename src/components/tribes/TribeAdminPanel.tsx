
import { useState } from "react";
import type { NostrEvent } from "@nostrify/nostrify";
import { useNostr } from '@nostrify/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { generateTribeServicesQR, generateTribeServicesPoster, downloadQRCode, downloadSVGPoster } from "@/lib/qrGenerator";

import { AdminServicesPanel } from "../services/AdminServicesPanel";

import { Settings, UserCheck, UserX, Users, Loader2, QrCode, Download } from "lucide-react";

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
  const queryClient = useQueryClient();
  const { mutate: createEvent, isPending: isProcessing } = useNostrPublish();
  const { toast } = useToast();

  const [processingRequest, setProcessingRequest] = useState<string | null>(null);
  const [isCleaningDuplicates, setIsCleaningDuplicates] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);

  // Check if user is admin
  const userRole = tribe.tags.find(([name, pubkey, , role]) =>
    name === 'p' && pubkey === user?.pubkey && (role === 'admin' || role === 'moderator')
  )?.[3];

  const isAdmin = userRole === 'admin';
  const isModerator = userRole === 'moderator' || isAdmin;

  // Query for join requests and rejections
  const { data: joinRequests, isLoading: requestsLoading, refetch } = useQuery({
    queryKey: ['join-requests', tribeId],
    queryFn: async (c) => {
      const signal = 
        <Tabs defaultValue="requests">

          <TabsList className="grid w-full grid-cols-3">

          <TabsList className="grid w-full grid-cols-4">

            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Requests
              {joinRequests && joinRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {joinRequests.length}
                </Badge>
              )}
            </TabsTrigger>

            <TabsTrigger value="services" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Services QR

            <TabsTrigger value="moderate-services" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Services
            </TabsTrigger>
            <TabsTrigger value="services-qr" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Codes
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
          <TabsContent value="services" className="space-y-6">
          <TabsContent value="moderate-services">
            <AdminServicesPanel tribeId={tribeId} />
          </TabsContent>

          <TabsContent value="services-qr" className="space-y-6">

            
            
            
            
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Services QR Codes</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate QR codes and posters to promote your tribe's services
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={handleGenerateQR}
                    disabled={isGeneratingQR}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    {isGeneratingQR ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <QrCode className="h-6 w-6" />
                    )}
                    <div className="text-center">
                      <div className="font-medium">QR Code</div>
                      <div className="text-xs text-muted-foreground">
                        Download PNG for digital use
                      </div>
                    </div>
                  </Button>

                  <Button
                    onClick={handleGeneratePoster}
                    disabled={isGeneratingQR}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                  >
                    {isGeneratingQR ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : (
                      <Download className="h-6 w-6" />
                    )}
                    <div className="text-center">
                      <div className="font-medium">Poster</div>
                      <div className="text-xs text-muted-foreground">
                        Download SVG for printing
                      </div>
                    </div>
                  </Button>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">How to use:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• QR Code: Share digitally or print for local posting</li>
                  <li>• Poster: Print and display in community spaces</li>
                  <li>• Both link directly to your tribe's Services tab</li>
                  <li>• Helps neighbors discover and offer local services</li>
                </ul>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Member Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Clean up duplicate member entries and manage tribe membership
                </p>

                <Button
                  onClick={cleanDuplicateMembers}
                  disabled={isCleaningDuplicates}
                  variant="outline"
                >
                  {isCleaningDuplicates ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Users className="h-4 w-4 mr-2" />
                  )}
                  Clean Duplicate Members
                </Button>
              </div>
            </div>

            <div className="text-center py-8 border-t">
              <Settings className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <h3 className="font-semibold mb-1">More Settings</h3>
              <p className="text-sm text-muted-foreground">
                Additional tribe settings coming soon
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}