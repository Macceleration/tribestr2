import type { NostrEvent } from "@nostrify/nostrify";
import { useAuthor } from "@/hooks/useAuthor";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useJoinTribe } from "@/hooks/useTribesActions";
import { EditTribeDialog } from "./EditTribeDialog";
import { ShareButton } from "@/components/ShareButton";
import { createTribeShareLinks } from "@/lib/nostrLinks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Users, Calendar, Shield, UserPlus, Share2, Loader2, Settings } from "lucide-react";

interface TribeHeaderProps {
  tribe: NostrEvent;
}

export function TribeHeader({ tribe }: TribeHeaderProps) {
  const { user } = useCurrentUser();
  const author = useAuthor(tribe.pubkey);
  const { joinTribe, isPending: isJoining } = useJoinTribe();

  const dTag = tribe.tags.find(([name]) => name === 'd')?.[1] || '';
  const nameTag = tribe.tags.find(([name]) => name === 'name')?.[1];
  const descriptionTag = tribe.tags.find(([name]) => name === 'description')?.[1];
  const imageTag = tribe.tags.find(([name]) => name === 'image')?.[1];
  const locationTag = tribe.tags.find(([name]) => name === 'location')?.[1];

  const tribeName = nameTag || dTag;

  // Count members and roles
  const members = tribe.tags.filter(([name]) => name === 'p');
  const admins = members.filter(([, , , role]) => role === 'admin');
  const _moderators = members.filter(([, , , role]) => role === 'moderator');

  // Check visibility and access
  const isPublic = tribe.tags.some(([name]) => name === 'public');
  const isOpen = tribe.tags.some(([name]) => name === 'open');

  // Check if user is already a member
  const isMember = user && members.some(([, pubkey]) => pubkey === user.pubkey);
  const isCreator = user?.pubkey === tribe.pubkey;
  const isAdmin = user && members.some(([, pubkey, , role]) => pubkey === user.pubkey && role === 'admin');

  return (
    <Card>
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Tribe Avatar */}
          <Avatar className="h-24 w-24 mx-auto md:mx-0">
            <AvatarImage src={imageTag} alt={tribeName} />
            <AvatarFallback className="text-2xl">
              {tribeName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Tribe Info */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h1 className="text-3xl font-bold">{tribeName}</h1>
                <div className="flex gap-2 justify-center md:justify-start">
                  <Badge variant={isPublic ? "default" : "secondary"}>
                    {isPublic ? "Public" : "Private"}
                  </Badge>
                  <Badge variant={isOpen ? "default" : "outline"}>
                    {isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>
              </div>

              {descriptionTag && (
                <p className="text-lg text-muted-foreground">
                  {descriptionTag}
                </p>
              )}

              {descriptionTag && (
                <p className="text-lg text-muted-foreground">
                  {descriptionTag}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 justify-center md:justify-start text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{members.length} members</span>
              </div>

              {admins.length > 0 && (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>{admins.length} admin{admins.length !== 1 ? 's' : ''}</span>
                </div>
              )}

              {locationTag && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{locationTag}</span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Created {new Date(tribe.created_at * 1000).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Creator Info */}
            {author.data?.metadata && (
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="text-sm text-muted-foreground">Created by</span>
                <Avatar className="h-6 w-6">
                  <AvatarImage src={author.data.metadata.picture} alt={author.data.metadata.name} />
                  <AvatarFallback>
                    {(author.data.metadata.name || 'A').slice(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">
                  {author.data.metadata.name || author.data.metadata.display_name || 'Anonymous'}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 min-w-32">
            {user ? (
              isMember || isCreator ? (
                <Button disabled variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  {isCreator ? 'Your Tribe' : 'Member'}
                </Button>
              ) : (
                <Button
                  onClick={() => joinTribe(tribe)}
                  disabled={isJoining}
                  className="w-full"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 mr-2" />
                      {isOpen ? 'Join Tribe' : 'Request to Join'}
                    </>
                  )}
                </Button>
              )
            ) : (
              <Button disabled variant="outline">
                <UserPlus className="h-4 w-4 mr-2" />
                Login to Join
              </Button>
            )}

            {isAdmin && (
              <EditTribeDialog tribe={tribe}>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </EditTribeDialog>
            )}

            <ShareButton
              links={createTribeShareLinks(tribe.pubkey, dTag, tribeName)}
              title={tribeName}
              isEvent={false}
              eventDetails={descriptionTag || 'A great community to be part of!'}
              pubkey={tribe.pubkey}
              dTag={dTag}
            >
              <Button variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </ShareButton>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}