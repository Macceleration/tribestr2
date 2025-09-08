import { useState } from "react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNostrPublish } from "@/hooks/useNostrPublish";
import { useUploadFile } from "@/hooks/useUploadFile";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/useToast";
import { Upload, Loader2, Calendar, Clock } from "lucide-react";

interface CreateEventDialogProps {
  children: React.ReactNode;
  tribeId: string;
}

export function CreateEventDialog({ children, tribeId }: CreateEventDialogProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isCreating } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    description: '',
    location: '',
    image: '',
    date: '',
    time: '',
    duration: '60', // minutes
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create an event",
        variant: "destructive",
      });
      return;
    }

    if (!formData.title.trim() || !formData.date || !formData.time) {
      toast({
        title: "Error", 
        description: "Title, date, and time are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Parse date and time
      const eventDateTime = new Date(`${formData.date}T${formData.time}`);
      const startTimestamp = Math.floor(eventDateTime.getTime() / 1000);
      
      // Calculate end time if duration is provided
      const durationMinutes = parseInt(formData.duration) || 60;
      const endTimestamp = startTimestamp + (durationMinutes * 60);
      
      // Generate unique identifier
      const dTag = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const tags = [
        ['d', dTag],
        ['title', formData.title.trim()],
        ['start', startTimestamp.toString()],
        ['end', endTimestamp.toString()],
        ['a', `34550:${tribeId}`], // Reference to tribe
      ];

      if (formData.summary.trim()) {
        tags.push(['summary', formData.summary.trim()]);
      }

      if (formData.location.trim()) {
        tags.push(['location', formData.location.trim()]);
      }

      if (formData.image.trim()) {
        tags.push(['image', formData.image.trim()]);
      }

      // Add tribe reference for event discovery
      tags.push(['t', 'tribe-event']);

      createEvent({
        kind: 31923, // Time-based calendar event (NIP-52)
        content: formData.description.trim(),
        tags,
      });

      toast({
        title: "Success! 🎉",
        description: "Your event has been created",
      });

      setOpen(false);
      setFormData({
        title: '',
        summary: '',
        description: '',
        location: '',
        image: '',
        date: '',
        time: '',
        duration: '60',
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
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

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event 📅</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Vibe Coders Meetup #3"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="summary">Short Summary</Label>
              <Input
                id="summary"
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                placeholder="One-line description of your event"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What will happen at this event?"
                rows={3}
              />
            </div>
          </div>

          {/* Date & Time */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    min={today}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time">Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="60"
                min="15"
                max="480"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Tech Hub Downtown, 123 Main St"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Event Image</Label>
            <div className="space-y-3">
              {formData.image && (
                <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                  <img 
                    src={formData.image} 
                    alt="Event" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
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
                        <span className="text-sm">Upload Event Image</span>
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
                'Create Event'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}