import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Calendar, Mail, Video } from "lucide-react";
import { googleApi, type GoogleAuthStatus } from "@/services/googleApi"; 

export const GoogleAccountCard = () => {
  const [status, setStatus] = useState<GoogleAuthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const data = await googleApi.getStatus();
      setStatus(data);
    } catch (error) {
      console.error("Error fetching Google auth status:", error);
      setStatus({ authenticated: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleConnect = async () => {
    try {
      const data = await googleApi.initiateLogin();
      window.location.href = data.redirect_url;
    } catch (error) {
      console.error("Login failed", error);
      toast({
        title: "Connection Failed",
        description: "Could not initiate Google login. Please try again.",
        variant: "destructive",
      });
    }
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
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-foreground">Google Account</h3>
            {status?.authenticated ? (
              <Badge className="bg-success/10 text-success hover:bg-success/20 border-success/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                <XCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </div>
          
          {status?.authenticated ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Access to Calendar, Gmail, and Google Meet
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Calendar
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Mail className="w-3 h-3 mr-1" />
                  Gmail
                </Badge>
                <Badge variant="outline" className="text-xs">
                  <Video className="w-3 h-3 mr-1" />
                  Meet
                </Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect to schedule interviews and send emails
            </p>
          )}
        </div>
      </div>

      <div className="w-full sm:w-auto">
        <Button
          onClick={handleConnect}
          className={status?.authenticated ? "w-full sm:w-auto" : "w-full sm:w-auto"}
          variant={status?.authenticated ? "outline" : "default"}
        >
          {status?.authenticated ? "Reconnect" : "Connect Google"}
        </Button>
      </div>
    </div>
  );
};