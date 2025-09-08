import { useSeoMeta } from '@unhead/react';
import { useParams } from 'react-router-dom';
import { ProfileView } from '@/components/profile/ProfileView';
import NotFound from './NotFound';

const ProfilePage = () => {
  const { pubkey } = useParams<{ pubkey: string }>();

  useSeoMeta({
    title: 'Profile - Tribes',
    description: 'View user profile, badges, and tribe memberships.',
  });

  if (!pubkey) {
    return <NotFound />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProfileView pubkey={pubkey} />
    </div>
  );
};

export default ProfilePage;