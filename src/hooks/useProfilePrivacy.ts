import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export interface ProfilePrivacySettings {
  showTribes: boolean;
  showBadges: boolean;
  showBasicInfo: boolean;
}

const defaultSettings: ProfilePrivacySettings = {
  showTribes: true,
  showBadges: true,
  showBasicInfo: true,
};

export function useProfilePrivacy(pubkey: string) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['profile-privacy', pubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(1500)]);

      const events = await nostr.query([
        {
          kinds: [30078], // Application-specific data
          authors: [pubkey],
          '#d': ['profile-privacy'],
          limit: 1,
        }
      ], { signal });

      if (events.length === 0) {
        return defaultSettings;
      }

      try {
        const settings = JSON.parse(events[0].content);
        return { ...defaultSettings, ...settings };
      } catch {
        return defaultSettings;
      }
    },
    enabled: !!pubkey,
  });
}