import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Briefcase } from "lucide-react";

const API_BASE_URL = "http://127.0.0.1:8000";

interface LinkedInAuthStatus {
  authenticated: boolean;
  urn?: string;
  expires_at?: string;
  hr_id?: number;
}

export const LinkedInAccountCard = () => {
  const [status, setStatus] = useState<LinkedInAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const hrId = 1;
      const response = await fetch(`${API_BASE_URL}/linkedin/auth/status`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      } else {
        setStatus({ authenticated: false });
      }
    } catch (error) {
      console.error("Error fetching LinkedIn auth status:", error);
      setStatus({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

const handleConnect = async () => {
  const token = localStorage.getItem("authToken");

  const response = await fetch(`${API_BASE_URL}/linkedin/auth/login`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
  });

  const data = await response.json();
  window.location.href = data.redirect_url;
};

  if (loading) {
    return (
      <div className="flex items-center justify-between p-6 border border-border rounded-lg bg-card animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-muted rounded-lg" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-muted rounded" />
            <div className="h-4 w-48 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 border border-border rounded-lg bg-card hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4 flex-1">
        <div className="w-12 h-12 bg-gradient-to-br from-[#0077B5] to-[#00669c] rounded-lg flex items-center justify-center flex-shrink-0">
          <svg
            className="w-6 h-6 text-white"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-foreground">
              LinkedIn Account
            </h3>
            {status?.authenticated ? (
              <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground"
              >
                <XCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>

          {status?.authenticated ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Post job openings directly to LinkedIn
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <Briefcase className="w-3 h-3 mr-1" />
                  Job Posting
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect to post jobs to your LinkedIn profile
            </p>
          )}
        </div>
      </div>

      <div className="w-full sm:w-auto">
        <Button
          onClick={handleConnect}
          className={
            status?.authenticated ? "w-full sm:w-auto" : "w-full sm:w-auto"
          }
          variant={status?.authenticated ? "outline" : "default"}
        >
          {status?.authenticated ? "Reconnect" : "Connect LinkedIn"}
        </Button>
      </div>
    </div>
  );
};
