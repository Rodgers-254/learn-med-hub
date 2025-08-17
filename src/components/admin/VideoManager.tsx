import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Play } from "lucide-react";
import { VideoForm } from "./VideoForm";
import { useToast } from "@/components/ui/use-toast";

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
  createdAt: string;
}

export const VideoManager = () => {
  const [videos, setVideos] = useState<Video[]>([
    {
      id: "1",
      title: "Heart Surgery Fundamentals",
      description: "Step-by-step guide to basic heart surgery procedures",
      category: "Cardiology",
      duration: "45:30",
      subscriptionTier: "Premium",
      thumbnail: "/placeholder.svg",
      videoUrl: "",
      status: 'published',
      createdAt: "2024-01-15"
    },
    {
      id: "2",
      title: "Emergency CPR Techniques",
      description: "Life-saving CPR procedures for emergency situations",
      category: "Emergency Medicine",
      duration: "20:15",
      subscriptionTier: "Standard",
      thumbnail: "/placeholder.svg",
      videoUrl: "",
      status: 'published',
      createdAt: "2024-01-12"
    }
  ]);

  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleAddVideo = (videoData: Partial<Video>) => {
    const newVideo: Video = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'draft',
      ...videoData
    } as Video;
    
    setVideos(prev => [...prev, newVideo]);
    setDialogOpen(false);
    toast({
      title: "Video Added",
      description: "New video has been successfully added.",
    });
  };

  const handleEditVideo = (videoData: Partial<Video>) => {
    setVideos(prev => prev.map(video => 
      video.id === selectedVideo?.id ? { ...video, ...videoData } : video
    ));
    setSelectedVideo(null);
    setDialogOpen(false);
    toast({
      title: "Video Updated",
      description: "Video has been successfully updated.",
    });
  };

  const handleDeleteVideo = (videoId: string) => {
    setVideos(prev => prev.filter(video => video.id !== videoId));
    toast({
      title: "Video Deleted",
      description: "Video has been successfully deleted.",
      variant: "destructive"
    });
  };

  const openEditDialog = (video: Video) => {
    setSelectedVideo(video);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    setSelectedVideo(null);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Video Library</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add New Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedVideo ? 'Edit Video' : 'Add New Video'}
              </DialogTitle>
              <DialogDescription>
                {selectedVideo ? 'Update video information' : 'Add a new medical procedure video'}
              </DialogDescription>
            </DialogHeader>
            <VideoForm
              video={selectedVideo}
              onSubmit={selectedVideo ? handleEditVideo : handleAddVideo}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {videos.map((video) => (
              <TableRow key={video.id}>
                <TableCell className="font-medium">{video.title}</TableCell>
                <TableCell>{video.category}</TableCell>
                <TableCell>{video.duration}</TableCell>
                <TableCell>
                  <Badge variant={video.subscriptionTier === 'Premium' ? 'default' : 'secondary'}>
                    {video.subscriptionTier}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={video.status === 'published' ? 'default' : 'secondary'}>
                    {video.status}
                  </Badge>
                </TableCell>
                <TableCell>{video.createdAt}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(video)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteVideo(video.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};