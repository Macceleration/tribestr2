import { useState } from "react";
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
import { Upload, Loader2 } from "lucide-react";

interface CreateTribeDialogProps {
  children: React.ReactNode;
}

export function CreateTribeDialog({ children }: CreateTribeDialogProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isCreating } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    location: '',
    image: '',
    isPublic: true,
    isOpen: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a tribe",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "Error", 
        description: "Tribe name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a unique identifier for the tribe
      const dTag = `tribe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const tags = [
        ['d', dTag],
        ['name', formData.name.trim()],
        ['t', 'tribe'], // Tag for tribe discovery
      ];

      if (formData.description.trim()) {
        tags.push(['description', formData.description.trim()]);
      }

      if (formData.location.trim()) {
        tags.push(['location', formData.location.trim()]);
      }

      if (formData.image.trim()) {
        tags.push(['image', formData.image.trim()]);
      }

      // Add creator as admin
      tags.push(['p', user.pubkey, '', 'admin']);

      // Add visibility and access tags
      if (formData.isPublic) {
        tags.push(['public']);
      } else {
        tags.push(['private']);
      }

      if (formData.isOpen) {
        tags.push(['open']);
      } else {
        tags.push(['closed']);
      }

      createEvent({
        kind: 34550, // Community Definition (NIP-72)
        content: formData.description.trim(),
        tags,
      });

      toast({
        title: "Success! 🎉",
        description: "Your tribe has been created",
      });

      setOpen(false);
      setFormData({
        name: '',
        description: '',
        location: '',
        image: '',
        isPublic: true,
        isOpen: true,
      });
    } catch (error) {
      console.error('Error creating tribe:', error);
      toast({
        title: "Error",
        description: "Failed to create tribe. Please try again.",
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Tribe 🌟</DialogTitle>
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
                          <span className="text-sm">Upload Image</span>
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
            <Button type="submit" disabled={isCreating || isUploading} className="flex-1">
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Tribe'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}