import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Send, Sparkles, Image as ImageIcon, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { generationApi } from "@/services/generationsApi";
import { linkedinApi } from "@/services/linkedInApi"; // Ensure filename matches

interface LinkedInPostPreviewProps {
  jobTitle: string;
  applyLink: string;
  onClose: () => void;
}

interface ApiGenerationResponse {
  caption: string;
  image_base64: string;
}

interface GeneratedPost {
  image: string; // This is the full Data URL (data:image/png;base64,...)
  caption: string;
}

// Helper: Convert Base64 Data URL to a JS File Object
const base64ToFile = (dataUrl: string, filename: string): File => {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, {type:mime});
}

export const LinkedInPostPreview = ({ jobTitle, applyLink, onClose }: LinkedInPostPreviewProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);

  const generatePost = async () => {
    setIsGenerating(true);
    try {
      // Assuming generationApi is working as expected
      const data = await generationApi.generateLinkedinPost({
        prompt: `Create a professional LinkedIn post for a job opening: ${jobTitle}`,
      }) as unknown as ApiGenerationResponse;

      if (!data.image_base64) {
        throw new Error("Received empty image data from server");
      }

      setGeneratedPost({
        // Ensure strictly prefixed base64 string
        image: `data:image/png;base64,${data.image_base64}`,
        caption: data.caption,
      });

      toast({
        title: "Content Generated",
        description: "Review your post below before publishing.",
      });
    } catch (error: any) {
      console.error("Generation Error:", error);
      toast({
        title: "Generation Failed",
        description: error.message || "Could not generate post content.",
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
      // 1. Convert the Base64 image state to a File object
      const imageFile = base64ToFile(generatedPost.image, "linkedin-post-image.png");

      // 2. Call the API with all required arguments
      await linkedinApi.createPost(
        generatedPost.caption, 
        applyLink, 
        imageFile
      );

      toast({
        title: "Published Successfully",
        description: "Your job post is now live on LinkedIn.",
      });

      onClose();
    } catch (error: any) {
      console.error("Posting Error:", error);
      toast({
        title: "Posting Failed",
        description: error.message || "Failed to post to LinkedIn",
        variant: "destructive",
      });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Card className="w-full max-w-5xl mx-auto shadow-2xl border-border/60 bg-card overflow-hidden flex flex-col h-[85vh] md:h-auto md:max-h-[90vh]">
      {/* Header */}
      <CardHeader className="border-b bg-muted/30 pb-4">
        <div className="flex items-center justify-between">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-600/10 rounded-md">
                        <Sparkles className="h-5 w-5 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl font-bold">LinkedIn AI Composer</CardTitle>
                </div>
                <CardDescription>
                    Drafting content for: <span className="font-medium text-foreground">{jobTitle}</span>
                </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-destructive">
                <X className="h-5 w-5" />
            </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-0">
        {/* State 1: Initial Empty State */}
        {!generatedPost && !isGenerating && (
          <div className="h-full flex flex-col items-center justify-center p-8 md:p-12 text-center space-y-6 min-h-[400px]">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full flex items-center justify-center border border-blue-100 shadow-sm">
              <Sparkles className="h-10 w-10 text-blue-600" />
            </div>
            <div className="max-w-md space-y-2">
              <h3 className="text-2xl font-semibold tracking-tight">Ready to hire?</h3>
              <p className="text-muted-foreground">
                Our AI will generate a high-converting image and professional caption tailored for this role in seconds.
              </p>
            </div>
            <Button 
                onClick={generatePost} 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Post Content
            </Button>
          </div>
        )}

        {/* State 2: Loading State */}
        {isGenerating && (
          <div className="h-full flex flex-col items-center justify-center p-12 min-h-[400px] space-y-6">
            <div className="relative">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <Loader2 className="h-16 w-16 animate-spin text-blue-600 relative z-10" />
            </div>
            <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">Crafting your post...</h3>
                <p className="text-sm text-muted-foreground animate-pulse">Analyzing job details • Designing image • Writing copy</p>
            </div>
          </div>
        )}

        {/* State 3: Result View */}
        {generatedPost && !isGenerating && (
          <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
            
            {/* Left Column: Image Preview */}
            <div className="bg-slate-50/50 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r flex flex-col gap-4 justify-center items-center">
                <div className="w-full max-w-md space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                            <ImageIcon className="h-4 w-4" /> Generated Visual
                        </Label>
                        <Badge variant="secondary" className="bg-white shadow-sm">1080 x 1080</Badge>
                    </div>
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden border shadow-sm bg-white group">
                        <img
                            src={generatedPost.image}
                            alt="LinkedIn Generated Content"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    </div>
                </div>
            </div>

            {/* Right Column: Caption Editor */}
            <div className="p-6 lg:p-8 flex flex-col gap-4 bg-white">
                <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-4 w-4" /> Caption
                    </Label>
                    <span className="text-xs text-muted-foreground">
                        {generatedPost.caption.length} characters
                    </span>
                </div>
                
                <Textarea
                    value={generatedPost.caption}
                    onChange={(e) => setGeneratedPost({...generatedPost, caption: e.target.value})}
                    className="flex-1 min-h-[300px] p-4 font-sans text-base leading-relaxed resize-none border-muted focus-visible:ring-blue-600"
                    placeholder="Write your caption here..."
                />
                
                <div className="bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded-md border border-blue-100">
                    <strong>Tip:</strong> You can edit the text above before publishing. Hashtags are included automatically.
                </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer Actions */}
      {generatedPost && !isGenerating && (
        <CardFooter className="border-t bg-muted/10 p-4 md:p-6 flex flex-col sm:flex-row gap-3 justify-end items-center">
            <Button
                variant="outline"
                onClick={generatePost}
                disabled={isPosting}
                className="w-full sm:w-auto hover:bg-slate-100"
            >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
            </Button>
            
            <Button
                onClick={postToLinkedIn}
                disabled={isPosting}
                className="w-full sm:w-auto bg-[#0A66C2] hover:bg-[#004182] min-w-[160px]"
            >
                {isPosting ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Publishing...
                    </>
                ) : (
                    <>
                        <Send className="h-4 w-4 mr-2" />
                        Post to LinkedIn
                    </>
                )}
            </Button>
        </CardFooter>
      )}
    </Card>
  );
};