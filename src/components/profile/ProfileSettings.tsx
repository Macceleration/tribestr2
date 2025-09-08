import { useState, useEffect } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useProfilePrivacy } from "@/hooks/useProfilePrivacy";
import { useToast } from "@/hooks/useToast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Save, User, Eye } from "lucide-react";

export function ProfileSettings() {
  const { user, metadata } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { data: existingPrivacySettings } = useProfilePrivacy(user?.pubkey || "");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    display_name: "",
    about: "",
    picture: "",
    banner: "",
    website: "",
    nip05: "",
    lud16: "",
  });

  const [privacySettings, setPrivacySettings] = useState({
    showTribes: true,
    showBadges: true,
    showBasicInfo: true,
  });

  // Update form data when user metadata loads
  useEffect(() => {
    if (metadata) {
      setFormData({
        name: metadata.name || "",
        display_name: metadata.display_name || "",
        about: metadata.about || "",
        picture: metadata.picture || "",
        banner: metadata.banner || "",
        website: metadata.website || "",
        nip05: metadata.nip05 || "",
        lud16: metadata.lud16 || "",
      });
    }
  }, [metadata]);

  // Update privacy settings when they load
  useEffect(() => {
    if (existingPrivacySettings) {
      setPrivacySettings(existingPrivacySettings);
    }
  }, [existingPrivacySettings]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrivacyChange = (field: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      // Update profile metadata (kind 0)
      const cleanedData = Object.fromEntries(
        Object.entries(formData).filter(([, value]) => value.trim() !== "")
      );

      createEvent({
        kind: 0,
        content: JSON.stringify(cleanedData),
        tags: [],
      });

      // Save privacy settings (kind 30078 - Application-specific data)
      createEvent({
        kind: 30078,
        content: JSON.stringify(privacySettings),
        tags: [
          ['d', 'profile-privacy'],
          ['alt', 'Profile privacy settings'],
        ],
      });

      toast({
        title: "✅ Profile Updated!",
        description: "Your profile and privacy settings have been saved.",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-12 px-8 text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold mb-2">Login Required</h3>
          <p className="text-muted-foreground">
            Please log in to edit your profile
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Your display name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="display_name">Display Name</Label>
              <Input
                id="display_name"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="Alternative display name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="about">About</Label>
            <Textarea
              id="about"
              value={formData.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
              placeholder="Tell people about yourself..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="picture">Profile Picture URL</Label>
            <Input
              id="picture"
              value={formData.picture}
              onChange={(e) => handleInputChange('picture', e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner">Banner Image URL</Label>
            <Input
              id="banner"
              value={formData.banner}
              onChange={(e) => handleInputChange('banner', e.target.value)}
              placeholder="https://example.com/banner.jpg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nip05">NIP-05 Identifier</Label>
              <Input
                id="nip05"
                value={formData.nip05}
                onChange={(e) => handleInputChange('nip05', e.target.value)}
                placeholder="name@domain.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lud16">Lightning Address</Label>
            <Input
              id="lud16"
              value={formData.lud16}
              onChange={(e) => handleInputChange('lud16', e.target.value)}
              placeholder="name@wallet.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show Basic Information</Label>
              <p className="text-sm text-muted-foreground">
                Display your name, about, and contact info publicly
              </p>
            </div>
            <Switch
              checked={privacySettings.showBasicInfo}
              onCheckedChange={(checked) => handlePrivacyChange('showBasicInfo', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show Tribe Memberships</Label>
              <p className="text-sm text-muted-foreground">
                Display which tribes you're a member of
              </p>
            </div>
            <Switch
              checked={privacySettings.showTribes}
              onCheckedChange={(checked) => handlePrivacyChange('showTribes', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Show Badges</Label>
              <p className="text-sm text-muted-foreground">
                Display your earned badges and achievements
              </p>
            </div>
            <Switch
              checked={privacySettings.showBadges}
              onCheckedChange={(checked) => handlePrivacyChange('showBadges', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending} size="lg">
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}