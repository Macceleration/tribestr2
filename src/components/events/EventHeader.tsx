import type { NostrEvent } from "@nostrify/nostrify";
import { ShareButton } from "@/components/ShareButton";
import { createEventShareLinks } from "@/lib/nostrLinks";
import { debugNaddr } from "@/utils/debugNaddr";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Share2 } from "lucide-react";

interface EventHeaderProps {
  event: NostrEvent;
  userRSVP?: NostrEvent | null;
}

export function EventHeader({ event, userRSVP }: EventHeaderProps) {
  const dTag = event.tags.find(([name]) => name === 'd')?.[1] || '';
  const titleTag = event.tags.find(([name]) => name === 'title')?.[1];
  const summaryTag = event.tags.find(([name]) => name === 'summary')?.[1];
  const imageTag = event.tags.find(([name]) => name === 'image')?.[1];
  const locationTag = event.tags.find(([name]) => name === 'location')?.[1];
  const startTag = event.tags.find(([name]) => name === 'start')?.[1];
  const endTag = event.tags.find(([name]) => name === 'end')?.[1];

  const eventTitle = titleTag || 'Untitled Event';

  // Debug logging for event sharing
  const shareLinks = createEventShareLinks(event.pubkey, dTag, eventTitle);
  console.log('Event Header Debug:', {
    eventId: event.id.slice(0, 8),
    eventKind: event.kind,
    eventPubkey: event.pubkey.slice(0, 8),
    dTag,
    eventTitle,
    hasTitle: !!titleTag,
    hasStart: !!startTag,
    hasLocation: !!locationTag,
    allTags: event.tags,
    shareLinks,
    decodedNaddr: debugNaddr(shareLinks.naddr)
  });

  // Parse timestamps
  const startTime = startTag ? new Date(parseInt(startTag) * 1000) : null;
  const endTime = endTag ? new Date(parseInt(endTag) * 1000) : null;

  // Check if event is in the past (after duration + 1 hour grace period)
  const now = new Date();
  let isPast = false;
  if (startTime) {
    const eventEnd = endTime || new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour if no end time
    const eventEndWithGrace = new Date(eventEnd.getTime() + 60 * 60 * 1000); // +1 hour grace period
    isPast = eventEndWithGrace < now;
  }

  // Format date and time
  const formatEventDateTime = () => {
    if (!startTime) return 'Time TBD';

    const dateStr = startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const timeStr = startTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    return `${dateStr} at ${timeStr}`;
  };

  const formatDuration = () => {
    if (!startTime || !endTime) return null;

    const durationMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours === 0) {
      return `${minutes} minutes`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours}h ${minutes}m`;
    }
  };

  // Get user's RSVP status
  const rsvpStatus = userRSVP?.tags.find(([name]) => name === 'status')?.[1];

  const getRSVPBadge = () => {
    if (!rsvpStatus) return null;

    const variants = {
      accepted: { variant: 'default' as const, emoji: '✅', text: 'Going' },
      tentative: { variant: 'secondary' as const, emoji: '🤔', text: 'Maybe' },
      declined: { variant: 'outline' as const, emoji: '❌', text: 'Not Going' },
    };

    const config = variants[rsvpStatus as keyof typeof variants];
    if (!config) return null;

    return (
      <Badge variant={config.variant}>
        {config.emoji} {config.text}
      </Badge>
    );
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Event Image */}
        {imageTag && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <img
              src={imageTag}
              alt={eventTitle}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Event Info */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold">{eventTitle}</h1>
                  {isPast && (
                    <Badge variant="secondary">Past Event</Badge>
                  )}
                  {getRSVPBadge()}
                </div>

                {summaryTag && (
                  <p className="text-lg text-muted-foreground">
                    {summaryTag}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <ShareButton
                  links={shareLinks}
                  title={eventTitle}
                  isEvent={true}
                  eventDetails={summaryTag || event.content || 'Join us for this event!'}
                  pubkey={event.pubkey}
                  dTag={dTag}
                >
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </ShareButton>
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">{formatEventDateTime()}</div>
                  {formatDuration() && (
                    <div className="text-muted-foreground">Duration: {formatDuration()}</div>
                  )}
                </div>
              </div>

              {locationTag && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div className="font-medium">{locationTag}</div>
                </div>
              )}
            </div>

            {/* Event Description */}
            {event.content && (
              <div className="pt-4 border-t">
                <h3 className="font-semibold mb-2">About this event</h3>
                <div className="prose prose-sm max-w-none">
                  <p className="whitespace-pre-wrap">{event.content}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}