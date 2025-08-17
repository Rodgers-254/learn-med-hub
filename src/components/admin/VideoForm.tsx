import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";

interface Video {
  id: string;
  title: string;
  description: string;
  category: string;
  duration: string;
  subscriptionTier: string;
  thumbnail: string;
  videoUrl: string;
  status: 'published' | 'draft';
}

interface VideoFormProps {
  video?: Video | null;
  onSubmit: (videoData: Partial<Video>) => void;
}

export const VideoForm = ({ video, onSubmit }: VideoFormProps) => {
  const [formData, setFormData] = useState({
    title: video?.title || "",
    description: video?.description || "",
    category: video?.category || "",
    duration: video?.duration || "",
    subscriptionTier: video?.subscriptionTier || "Basic",
    status: video?.status || "draft",
    thumbnail: video?.thumbnail || "",
    videoUrl: video?.videoUrl || "",
    videoFile: null as File | null,
    thumbnailFile: null as File | null
  });

  const categories = [
    "Cardiology",
    "Emergency Medicine", 
    "Surgery",
    "Pediatrics",
    "Neurology",
    "Radiology",
    "Internal Medicine",
    "Gynecology",
    "Dermatology",
    "Psychiatry"
  ];

  const subscriptionTiers = ["Basic", "Standard", "Premium"];
  const statusOptions = ["draft", "published"];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (field: 'videoFile' | 'thumbnailFile', file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you'd upload files to Firebase Storage here
    const videoData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      duration: formData.duration,
      subscriptionTier: formData.subscriptionTier,
      status: formData.status as 'published' | 'draft',
      thumbnail: formData.thumbnailFile ? URL.createObjectURL(formData.thumbnailFile) : formData.thumbnail,
      videoUrl: formData.videoFile ? URL.createObjectURL(formData.videoFile) : formData.videoUrl
    };

    onSubmit(videoData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Video Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleInputChange("title", e.target.value)}
          placeholder="Enter video title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Enter video description"
          rows={3}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (mm:ss)</Label>
          <Input
            id="duration"
            value={formData.duration}
            onChange={(e) => handleInputChange("duration", e.target.value)}
            placeholder="45:30"
            pattern="[0-9]+:[0-9]{2}"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tier">Subscription Tier</Label>
          <Select value={formData.subscriptionTier} onValueChange={(value) => handleInputChange("subscriptionTier", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {subscriptionTiers.map((tier) => (
                <SelectItem key={tier} value={tier}>
                  {tier}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Video Thumbnail</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('thumbnail-upload')?.click()}
                >
                  Choose Thumbnail
                </Button>
                <input
                  id="thumbnail-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileChange('thumbnailFile', e.target.files?.[0] || null)}
                />
              </div>
              {formData.thumbnailFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.thumbnailFile.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Video File</Label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('video-upload')?.click()}
                >
                  Choose Video
                </Button>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => handleFileChange('videoFile', e.target.files?.[0] || null)}
                />
              </div>
              {formData.videoFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.videoFile.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit">
          {video ? 'Update Video' : 'Add Video'}
        </Button>
      </div>
    </form>
  );
};