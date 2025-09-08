import type { NostrEvent } from "@nostrify/nostrify";
import { useAuthor } from "@/hooks/useAuthor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { genUserName } from "@/lib/genUserName";
import { Users, UserCheck, UserX, HelpCircle } from "lucide-react";

interface EventAttendeeListProps {
  rsvps: NostrEvent[];
  isLoading: boolean;
  attendanceRecords?: NostrEvent[];
}

interface AttendeeCardProps {
  rsvp: NostrEvent;
  hasAttended?: boolean;
}

function AttendeeCard({ rsvp, hasAttended }: AttendeeCardProps) {
  const author = useAuthor(rsvp.pubkey);
  const metadata = author.data?.metadata;

  const displayName = metadata?.name || metadata?.display_name || genUserName(rsvp.pubkey);
  const status = rsvp.tags.find(([name]) => name === 'status')?.[1];
  const note = rsvp.content;

  const getStatusConfig = () => {
    // If user has attended, show attendance status regardless of RSVP
    if (hasAttended && status === 'accepted') {
      return {
        icon: <UserCheck className="h-4 w-4" />,
        label: 'Attended',
        variant: 'default' as const,
        emoji: '🎉'
      };
    }

    switch (status) {
      case 'accepted':
        return {
          icon: <UserCheck className="h-4 w-4" />,
          label: 'Going',
          variant: 'default' as const,
          emoji: '✅'
        };
      case 'tentative':
        return {
          icon: <HelpCircle className="h-4 w-4" />,
          label: 'Maybe',
          variant: 'secondary' as const,
          emoji: '🤔'
        };
      case 'declined':
        return {
          icon: <UserX className="h-4 w-4" />,
          label: 'Not Going',
          variant: 'outline' as const,
          emoji: '❌'
        };
      default:
        return {
          icon: <HelpCircle className="h-4 w-4" />,
          label: 'Unknown',
          variant: 'outline' as const,
          emoji: '❓'
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={metadata?.picture} alt={displayName} />
            <AvatarFallback>
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium truncate">{displayName}</h4>
              <Badge variant={statusConfig.variant} className="text-xs">
                <span className="mr-1">{statusConfig.emoji}</span>
                {statusConfig.label}
              </Badge>
            </div>

            {note && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {note}
              </p>
            )}

            <div className="text-xs text-muted-foreground mt-1">
              RSVP'd {new Date(rsvp.created_at * 1000).toLocaleDateString()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function EventAttendeeList({ rsvps, isLoading, attendanceRecords }: EventAttendeeListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendees
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Create a set of attendees who actually checked in
  const attendedPubkeys = new Set(
    attendanceRecords?.map(record => record.pubkey) || []
  );

  // Group RSVPs by status
  const going = rsvps.filter(rsvp =>
    rsvp.tags.find(([name]) => name === 'status')?.[1] === 'accepted'
  );
  const maybe = rsvps.filter(rsvp =>
    rsvp.tags.find(([name]) => name === 'status')?.[1] === 'tentative'
  );
  const notGoing = rsvps.filter(rsvp =>
    rsvp.tags.find(([name]) => name === 'status')?.[1] === 'declined'
  );

  // Separate attended from just RSVP'd
  const attended = going.filter(rsvp => attendedPubkeys.has(rsvp.pubkey));
  const goingOnly = going.filter(rsvp => !attendedPubkeys.has(rsvp.pubkey));

  // Sort each group by RSVP date (most recent first)
  const sortByDate = (a: NostrEvent, b: NostrEvent) => b.created_at - a.created_at;
  attended.sort(sortByDate);
  goingOnly.sort(sortByDate);
  maybe.sort(sortByDate);
  notGoing.sort(sortByDate);

  if (rsvps.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendees
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="text-lg font-semibold mb-2">No RSVPs yet</h3>
          <p className="text-muted-foreground">
            Be the first to RSVP for this event!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Attendees ({rsvps.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Attended */}
        {attended.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold">Attended ({attended.length})</h4>
            </div>
            <div className="space-y-2">
              {attended.map((rsvp) => (
                <AttendeeCard key={rsvp.id} rsvp={rsvp} hasAttended={true} />
              ))}
            </div>
          </div>
        )}

        {/* Going (but not yet attended) */}
        {goingOnly.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
              <h4 className="font-semibold">Going ({goingOnly.length})</h4>
            </div>
            <div className="space-y-2">
              {goingOnly.map((rsvp) => (
                <AttendeeCard key={rsvp.id} rsvp={rsvp} hasAttended={false} />
              ))}
            </div>
          </div>
        )}

        {/* Maybe */}
        {maybe.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold">Maybe ({maybe.length})</h4>
            </div>
            <div className="space-y-2">
              {maybe.map((rsvp) => (
                <AttendeeCard key={rsvp.id} rsvp={rsvp} />
              ))}
            </div>
          </div>
        )}

        {/* Not Going */}
        {notGoing.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-600" />
              <h4 className="font-semibold">Not Going ({notGoing.length})</h4>
            </div>
            <div className="space-y-2">
              {notGoing.map((rsvp) => (
                <AttendeeCard key={rsvp.id} rsvp={rsvp} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}