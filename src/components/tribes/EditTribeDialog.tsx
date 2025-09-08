import { useState } from "react";
import type { NostrEvent } from "@nostrify/nostrify";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useUploadFile } from "@/hooks/useUploadFile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/useToast";
import { Upload, Loader2, Settings } from "lucide-react";

interface EditTribeDialogProps {
  children: React.ReactNode;
  tribe: NostrEvent;
}

export function EditTribeDialog({ children, tribe }: EditTribeDialogProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isUpdating } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);

  // Get current tribe data
  const dTag = tribe.tags.find(([name]) => name === 'd')?.[1] || '';
  const currentName = tribe.tags.find(([name]) => name === 'name')?.[1] || '';
  const currentDescription = tribe.tags.find(([name]) => name === 'description')?.[1] || '';
  const currentLocation = tribe.tags.find(([name]) => name === 'location')?.[1] || '';
  const currentImage = tribe.tags.find(([name]) => name === 'image')?.[1] || '';
  const isCurrentlyPublic = tribe.tags.some(([name]) => name === 'public');
  const isCurrentlyOpen = tribe.tags.some(([name]) => name === 'open');

  const [formData, setFormData] = useState({
    name: currentName,
    description: currentDescription,
    location: currentLocation,
    image: currentImage,
    isPublic: isCurrentlyPublic,
    isOpen: isCurrentlyOpen,
  });

  // Check if user is admin
  const userRole = tribe.tags.find(([name, pubkey, , role]) => 
    name === 'p' && pubkey === user?.pubkey && role === 'admin'
  )?.[3];

  if (userRole !== 'admin') {
    return null; // Only admins can edit
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error", 
        description: "Tribe name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Preserve existing tags and update only the changed ones
      const newTags = tribe.tags.filter(([name]) => 
        !['name', 'description', 'location', 'image', 'public', 'private', 'open', 'closed'].includes(name)
      );

      // Add updated metadata tags
      newTags.push(['d', dTag]);
      newTags.push(['name', formData.name.trim()]);
      newTags.push(['t', 'tribe']);

      if (formData.description.trim()) {
        newTags.push(['description', formData.description.trim()]);
      }

      if (formData.location.trim()) {
        newTags.push(['location', formData.location.trim()]);
      }

      if (formData.image.trim()) {
        newTags.push(['image', formData.image.trim()]);
      }

      // Add visibility and access tags
      if (formData.isPublic) {
        newTags.push(['public']);
      } else {
        newTags.push(['private']);
      }

      if (formData.isOpen) {
        newTags.push(['open']);
      } else {
        newTags.push(['closed']);
      }

      createEvent({
        kind: 34550, // Community Definition (NIP-72)
        content: formData.description.trim(),
        tags: newTags,
      });

      toast({
        title: "Success! ✅",
        description: "Tribe settings have been updated",
      });

      setOpen(false);
    } catch (error) {
      console.error('Error updating tribe:', error);
      toast({
        title: "Error",
        description: "Failed to update tribe. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const [[, url]] = await uploadFile(file);
      setFormData(prev => ({ ...prev, image: url }));
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Edit Tribe Settings
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Tribe Image</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={formData.image} alt="Tribe" />
                <AvatarFallback>
                  {formData.name.slice(0, 2).toUpperCase() || 'TR'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
                    <CardContent className="py-4 px-6 text-center">
                      {isUploading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm">Change Image</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tribe Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Vibe Coders"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What's your tribe about?"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="e.g., San Francisco, CA"
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Public Tribe</Label>
                <p className="text-xs text-muted-foreground">
                  Anyone can see and read this tribe
                </p>
              </div>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isPublic: checked }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Open Membership</Label>
                <p className="text-xs text-muted-foreground">
                  Anyone can join without approval
                </p>
              </div>
              <Switch
                checked={formData.isOpen}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isOpen: checked }))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || isUploading} className="flex-1">
              {isUpdating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}