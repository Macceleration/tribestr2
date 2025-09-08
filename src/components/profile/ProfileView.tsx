import { useAuthor } from "@/hooks/useAuthor";
import { useUserBadgeAwards, useUserProfileBadges, useBadgeData } from "@/hooks/useBadges";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { genUserName } from "@/lib/genUserName";
import { User, Trophy, Calendar, MapPin } from "lucide-react";

interface ProfileViewProps {
  pubkey: string;
}

export function ProfileView({ pubkey }: ProfileViewProps) {
  const author = useAuthor(pubkey);
  const { data: badgeAwards, isLoading: badgeAwardsLoading } = useUserBadgeAwards(pubkey);
  const { data: _profileBadges } = useUserProfileBadges(pubkey);
  const { data: badgeData } = useBadgeData(badgeAwards || []);

  const metadata = author.data?.metadata;
  const displayName = metadata?.name || metadata?.display_name || genUserName(pubkey);

  if (author.isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-6">
              <Skeleton className="h-24 w-24 rounded-full mx-auto md:mx-0" />
              <div className="flex-1 space-y-4">
                <div className="space-y-2 text-center md:text-left">
                  <Skeleton className="h-8 w-48 mx-auto md:mx-0" />
                  <Skeleton className="h-4 w-64 mx-auto md:mx-0" />
                </div>
                <div className="flex gap-4 justify-center md:justify-start">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Profile Header */}
      <Card>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24 mx-auto md:mx-0">
              <AvatarImage src={metadata?.picture} alt={displayName} />
              <AvatarFallback className="text-2xl">
                {displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{displayName}</h1>
                {metadata?.about && (
                  <p className="text-lg text-muted-foreground">
                    {metadata.about}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{pubkey.slice(0, 8)}...{pubkey.slice(-8)}</span>
                </div>

                {metadata?.website && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <a
                      href={metadata.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground underline"
                    >
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Badges ({badgeAwards?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {badgeAwardsLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="text-center space-y-2">
                  <Skeleton className="h-16 w-16 rounded-lg mx-auto" />
                  <Skeleton className="h-4 w-20 mx-auto" />
                </div>
              ))}
            </div>
          ) : badgeData && badgeData.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badgeData.map(({ award, definition }) => {
                const badgeName = definition?.tags.find(([name]) => name === 'name')?.[1] || 'Badge';
                const badgeImage = definition?.tags.find(([name]) => name === 'image')?.[1];
                const _badgeDescription = definition?.tags.find(([name]) => name === 'description')?.[1];

                return (
                  <div key={award.id} className="text-center space-y-2 group cursor-pointer">
                    <div className="relative">
                      {badgeImage ? (
                        <img
                          src={badgeImage}
                          alt={badgeName}
                          className="h-16 w-16 rounded-lg mx-auto object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-lg mx-auto bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform">
                          🏆
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-medium line-clamp-2">{badgeName}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(award.created_at * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold mb-2">No badges yet</h3>
              <p className="text-muted-foreground">
                Earn badges by attending tribe events!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tribes Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Tribes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2">Tribe memberships</h3>
            <p className="text-muted-foreground">
              Tribe membership information coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}