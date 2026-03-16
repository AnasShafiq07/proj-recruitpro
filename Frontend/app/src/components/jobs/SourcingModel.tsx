import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;


interface SourcingModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onResultsFound: (candidates: any[]) => void;
}

export const SourcingModal = ({ isOpen, onOpenChange, onResultsFound }: SourcingModalProps) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      // Calling your FastAPI endpoint
      console.log("base url: ", API_BASE_URL)
      const response = await fetch(`${API_BASE_URL}/talent/sourcing/himalayas/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recruiter_query: query 
      }),
    });
      const data = await response.json();
      
      if (data.status === "success") {
        onResultsFound(data.candidates);
        onOpenChange(false);
        setQuery("");
      }
    } catch (error) {
      console.error("Sourcing error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Talent Sourcing
          </DialogTitle>
          <DialogDescription>
            Tell the AI who you're looking for. We'll search external platforms like Himalayas to find matching talent.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="e.g., Find me remote Senior React developers with experience in FinTech..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[120px] bg-background resize-none"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
            {isLoading ? "Searching..." : "Find Candidates"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};