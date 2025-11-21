import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleAccountCard } from "@/components/settings/GoogleAccountCard";
import { LinkedInAccountCard } from "@/components/settings/LinkedInAccountCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

const Settings = () => {
  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Manage your account and application preferences
            </p>
          </div>

          <div className="space-y-6">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Account Integrations</CardTitle>
                <CardDescription>
                  Connect your accounts to enable advanced features like
                  calendar scheduling and LinkedIn job postings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <GoogleAccountCard />
                <LinkedInAccountCard />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
