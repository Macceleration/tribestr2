import { Link } from "react-router-dom";
import type { NostrEvent } from "@nostrify/nostrify";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useJoinTribe } from "@/hooks/useTribesActions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, UserPlus, Loader2 } from "lucide-react";

interface TribeCardProps {
  tribe: NostrEvent;
}

export function TribeCard({ tribe }: TribeCardProps) {
  const { user } = useCurrentUser();
  const { joinTribe, isPending: isJoining } = useJoinTribe();
  const dTag = tribe.tags.find(([name]) => name === 'd')?.[1] || '';
  const nameTag = tribe.tags.find(([name]) => name === 'name')?.[1];
  const descriptionTag = tribe.tags.find(([name]) => name === 'description')?.[1];
  const imageTag = tribe.tags.find(([name]) => name === 'image')?.[1];
  const locationTag = tribe.tags.find(([name]) => name === 'location')?.[1];

  const tribeName = nameTag || dTag;
  const tribeId = `${tribe.pubkey}:${dTag}`;

  // Count moderators/members
  const moderators = tribe.tags.filter(([name, , , role]) =>
    name === 'p' && (role === 'moderator' || role === 'admin')
  );

  // Check if tribe is public/private and open/closed
  const isPublic = tribe.tags.some(([name]) => name === 'public');
  const isOpen = tribe.tags.some(([name]) => name === 'open');

  // Check if user is already a member
  const isMember = user && moderators.some(([, pubkey]) => pubkey === user.pubkey);
  const isCreator = user?.pubkey === tribe.pubkey;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={imageTag} alt={tribeName} />
            <AvatarFallback>
              {tribeName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{tribeName}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isPublic ? "default" : "secondary"} className="text-xs">
                {isPublic ? "Public" : "Private"}
              </Badge>
              <Badge variant={isOpen ? "default" : "outline"} className="text-xs">
                {isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {descriptionTag && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {descriptionTag}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{moderators.length} members</span>
            </div>
            {locationTag && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate max-w-20">{locationTag}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link to={`/tribe/${tribeId}`}>
              <Calendar className="h-3 w-3 mr-1" />
              View
            </Link>
          </Button>

          {user && !isMember && !isCreator && (
            <Button
              size="sm"
              onClick={() => joinTribe(tribe)}
              disabled={isJoining}
              className="flex-1"
            >
              {isJoining ? (
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <UserPlus className="h-3 w-3 mr-1" />
              )}
              {isJoining ? 'Joining...' : 'Join'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}