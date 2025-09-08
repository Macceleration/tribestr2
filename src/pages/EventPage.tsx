import { useSeoMeta } from '@unhead/react';
import { useParams } from 'react-router-dom';
import { EventView } from '@/components/events/EventView';
import NotFound from './NotFound';

const EventPage = () => {
  const { eventId } = useParams<{ eventId: string }>();

  useSeoMeta({
    title: 'Event - Tribes',
    description: 'View event details, RSVP list, and check-in information.',
  });

  if (!eventId) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <EventView eventId={eventId} />
    </div>
  );
};

export default EventPage;