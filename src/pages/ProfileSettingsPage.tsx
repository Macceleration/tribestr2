import { useSeoMeta } from '@unhead/react';
import { ProfileSettings } from '@/components/profile/ProfileSettings';

const ProfileSettingsPage = () => {
  useSeoMeta({
    title: 'Profile Settings - Tribes',
    description: 'Edit your profile information and privacy settings.',
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-muted-foreground">
            Manage your profile information and privacy preferences
          </p>
        </div>

        <ProfileSettings />
      </div>
    </div>
  );
};

export default ProfileSettingsPage;