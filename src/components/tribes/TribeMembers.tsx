import type { NostrEvent } from "@nostrify/nostrify";
import { useState } from "react";
import { useAuthor } from "@/hooks/useAuthor";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { genUserName } from "@/lib/genUserName";
import { Shield, Crown, User, Calendar, Loader2 } from "lucide-react";

interface TribeMembersProps {
  tribe: NostrEvent;
}

interface MemberCardProps {
  pubkey: string;
  role?: string;
  tribe: NostrEvent;
  canManageMembers: boolean;
}

function MemberCard({ pubkey, role, tribe, canManageMembers }: MemberCardProps) {
  const author = useAuthor(pubkey);
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isUpdating } = useNostrPublish();
  const { toast } = useToast();
  const [isEventCreator, setIsEventCreator] = useState(false);

  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || genUserName(pubkey);
  const about = metadata?.about;

  // Check if this member can create events (has event_creator role)
  const memberTags = tribe.tags.filter(([name, memberPubkey]) => name === 'p' && memberPubkey === pubkey);
  const hasEventCreatorRole = memberTags.some(([, , , memberRole]) => memberRole === 'event_creator');

  const toggleEventCreator = async () => {
    if (!user || !canManageMembers) return;

    try {
      setIsEventCreator(true);

      // Get current tribe data
      const _dTag = tribe.tags.find(([name]) => name === 'd')?.[1] || '';

      // Update tribe with new member roles
      const updatedTags = tribe.tags.map(tag => {
        // If this is a p tag for this member
        if (tag[0] === 'p' && tag[1] === pubkey) {
          if (hasEventCreatorRole) {
            // Remove event_creator role if they have it
            return tag[3] === 'event_creator' ? [tag[0], tag[1], tag[2]] : tag;
          } else {
            // Add event_creator role if they don't have it
            return [tag[0], tag[1], tag[2] || '', 'event_creator'];
          }
        }
        return tag;
      });

      // If member doesn't have event_creator role and no existing p tag found, add one
      if (!hasEventCreatorRole && !memberTags.some(([, , , memberRole]) => memberRole === 'event_creator')) {
        updatedTags.push(['p', pubkey, '', 'event_creator']);
      }

      createEvent({
        kind: 34550,
        content: tribe.content,
        tags: updatedTags,
      });

      toast({
        title: hasEventCreatorRole ? "Event Creator Role Removed" : "Event Creator Role Added",
        description: `${displayName} ${hasEventCreatorRole ? 'can no longer' : 'can now'} create events for this tribe`,
      });
    } catch (error) {
      console.error('Error updating member role:', error);
      toast({
        title: "Error",
        description: "Failed to update member role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsEventCreator(false);
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3" />;
      case 'moderator':
        return <Shield className="h-3 w-3" />;
      case 'event_creator':
        return <Calendar className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  const getRoleVariant = () => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'moderator':
        return 'secondary';
      case 'event_creator':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={metadata?.picture} alt={displayName} />
            <AvatarFallback>
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold truncate">{displayName}</h3>
              {role && (
                <Badge variant={getRoleVariant()} className="text-xs">
                  <div className="flex items-center gap-1">
                    {getRoleIcon()}
                    {role}
                  </div>
                </Badge>
              )}
            </div>

            {about && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {about}
              </p>
            )}

            {hasEventCreatorRole && (
              <Badge variant="outline" className="mb-3 text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                Can Create Events
              </Badge>
            )}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                View Profile
              </Button>

              {canManageMembers && role !== 'admin' && (
                <Button
                  variant={hasEventCreatorRole ? "destructive" : "default"}
                  size="sm"
                  onClick={toggleEventCreator}
                  disabled={isUpdating || isEventCreator}
                >
                  {isUpdating || isEventCreator ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Calendar className="h-3 w-3 mr-1" />
                  )}
                  {hasEventCreatorRole ? 'Remove Events' : 'Allow Events'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TribeMembers({ tribe }: TribeMembersProps) {
  const { user } = useCurrentUser();

  // Check if current user can manage members (is admin or tribe creator)
  const isCreator = user?.pubkey === tribe.pubkey;
  const isAdmin = user && tribe.tags.some(([name, pubkey, , role]) =>
    name === 'p' && pubkey === user.pubkey && role === 'admin'
  );
  const canManageMembers = isCreator || isAdmin;

  // Extract members with their roles
  const members = tribe.tags
    .filter(([name]) => name === 'p')
    .map(([, pubkey, , role]) => ({ pubkey, role }));

  // Separate by role for better organization
  const admins = members.filter(m => m.role === 'admin');
  const moderators = members.filter(m => m.role === 'moderator');
  const eventCreators = members.filter(m => m.role === 'event_creator');
  const regularMembers = members.filter(m => !m.role || !['admin', 'moderator', 'event_creator'].includes(m.role));

  if (members.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-6">
            <div className="text-4xl">👥</div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No members yet</h3>
              <p className="text-muted-foreground">
                This tribe is waiting for its first members to join
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Admins */}
      {admins.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            <h3 className="text-xl font-semibold">Admins</h3>
            <span className="text-sm text-muted-foreground">({admins.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {admins.map(({ pubkey, role }) => (
              <MemberCard key={pubkey} pubkey={pubkey} role={role} tribe={tribe} canManageMembers={!!canManageMembers} />
            ))}
          </div>
        </div>
      )}

      {/* Moderators */}
      {moderators.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-xl font-semibold">Moderators</h3>
            <span className="text-sm text-muted-foreground">({moderators.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moderators.map(({ pubkey, role }) => (
              <MemberCard key={pubkey} pubkey={pubkey} role={role} tribe={tribe} canManageMembers={!!canManageMembers} />
            ))}
          </div>
        </div>
      )}

      {/* Event Creators */}
      {eventCreators.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <h3 className="text-xl font-semibold">Event Creators</h3>
            <span className="text-sm text-muted-foreground">({eventCreators.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eventCreators.map(({ pubkey, role }) => (
              <MemberCard key={pubkey} pubkey={pubkey} role={role} tribe={tribe} canManageMembers={!!canManageMembers} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Members */}
      {regularMembers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            <h3 className="text-xl font-semibold">Members</h3>
            <span className="text-sm text-muted-foreground">({regularMembers.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularMembers.map(({ pubkey, role }) => (
              <MemberCard key={pubkey} pubkey={pubkey} role={role} tribe={tribe} canManageMembers={!!canManageMembers} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}