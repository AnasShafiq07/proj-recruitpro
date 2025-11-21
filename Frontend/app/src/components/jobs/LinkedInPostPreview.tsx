import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface LinkedInPostPreviewProps {
  jobTitle: string;
  onClose: () => void;
}

interface GeneratedPost {
  image: string;
  caption: string;
}

const API_BASE_URL = "http://127.0.0.1:8000";

export const LinkedInPostPreview = ({ jobTitle, onClose }: LinkedInPostPreviewProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);

  const generatePost = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("http://127.0.0.1:8000/generate/linkedin_post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          prompt: `Create a professional LinkedIn post for a job opening: ${jobTitle}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate LinkedIn post");
      }

      const data = await response.json();
      setGeneratedPost({
        image: data.image_url || data.image,
        caption: data.caption || data.text,
      });

      toast({
        title: "Post generated!",
        description: "Your LinkedIn post is ready.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to generate post",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const postToLinkedIn = async () => {
    if (!generatedPost) return;

    setIsPosting(true);
    try {
      const hrId = localStorage.getItem("hr_id");
      
      // Convert base64 image to blob if needed
      const formData = new FormData();
      formData.append("caption", generatedPost.caption);
      
      if (generatedPost.image.startsWith("data:")) {
        const response = await fetch(generatedPost.image);
        const blob = await response.blob();
        formData.append("image", blob, "linkedin-post.png");
      } else {
        // If it's a URL, fetch and convert to blob
        const response = await fetch(generatedPost.image);
        const blob = await response.blob();
        formData.append("image", blob, "linkedin-post.png");
      }

      const postResponse = await fetch(`http://127.0.0.1:8000/generate/post/${hrId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: formData,
      });

      if (!postResponse.ok) {
        throw new Error("Failed to post to LinkedIn");
      }

      toast({
        title: "Success!",
        description: "Your post has been shared on LinkedIn.",
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to post to LinkedIn",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  const updateCaption = (newCaption: string) => {
    if (generatedPost) {
      setGeneratedPost({ ...generatedPost, caption: newCaption });
    }
  };

  return (
    <Card className="shadow-elegant border-border/50 animate-scale-in">
      <CardHeader className="space-y-2 bg-gradient-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          <CardTitle className="text-xl">LinkedIn Post Generator</CardTitle>
        </div>
        <p className="text-sm opacity-90">
          Generate a professional post to share your job opening
        </p>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {!generatedPost && !isGenerating && (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-accent rounded-full flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-2">Ready to share on LinkedIn?</h3>
              <p className="text-muted-foreground text-sm">
                Generate an eye-catching post with AI to attract top talent
              </p>
            </div>
            <Button
              onClick={generatePost}
              className="bg-green-600 hover:bg-green-700"
            >
              <Sparkles className="h-4 w-4 mr-2 bg-green-600 hover:bg-green-700" />
              Generate Post
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="text-center py-12 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Creating your LinkedIn post...</p>
          </div>
        )}

        {generatedPost && !isGenerating && (
          <div className="space-y-6 animate-fade-in">
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Post Image
              </h4>
              <div className="relative rounded-lg overflow-hidden border border-border shadow-elegant">
                <img
                  src={generatedPost.image}
                  alt="LinkedIn post"
                  className="w-full h-auto"
                />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Caption
              </h4>
              <Textarea
                value={generatedPost.caption}
                onChange={(e) => updateCaption(e.target.value)}
                rows={8}
                className="resize-none font-sans"
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={generatePost}
                variant="outline"
                disabled={isGenerating}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
              <Button
                onClick={postToLinkedIn}
                disabled={isPosting}
              >
                {isPosting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post to LinkedIn
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        <Button
          onClick={onClose}
          className="w-full bg-red-500 hover:bg-red-600"
        >
          Close
        </Button>
      </CardContent>
    </Card>
  );
};
