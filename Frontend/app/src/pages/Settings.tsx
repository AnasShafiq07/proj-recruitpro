import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, UserPlus, Save, ShieldCheck, Lock, KeyRound } from "lucide-react";
import { GoogleAccountCard } from "@/components/settings/GoogleAccountCard";
import { LinkedInAccountCard } from "@/components/settings/LinkedInAccountCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { hrManagerApi } from "@/services/hrApi";

// Interface
export interface HRManager {
  id: number;
  name: string;
  email: string;
  role: string;
  password?: string | null;
  company_id?: number | null;
  created_at?: string;
}

const Settings = () => {
  const [user, setUser] = useState<HRManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 1. Profile Form State
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  // 2. Password Form State
  const [passwordData, setPasswordData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  // 3. Create HR Form State (Admin Only)
  const [newHrData, setNewHrData] = useState<Partial<HRManager>>({
    name: "",
    email: "",
    role: "hr",
    password: "",
    company_id: 0,
  });

  // Fetch Current User
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await hrManagerApi.getCurrentHR();
        setUser(data);
        setProfileData({ name: data.name, email: data.email });
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Handler: Update Basic Profile
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      await hrManagerApi.update(user.id, profileData);
      alert("Success: Profile updated successfully");
      setUser({ ...user, ...profileData });
    } catch (error) {
      alert("Error: Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  // Handler: Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Error: Passwords do not match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
        alert("Error: Password should be at least 6 characters");
        return;
    }

    setSaving(true);
    try {
      // Send only the password field
      await hrManagerApi.update(user.id, { password: passwordData.newPassword });
      alert("Success: Password changed successfully");
      setPasswordData({ newPassword: "", confirmPassword: "" });
    } catch (error) {
      alert("Error: Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  // Handler: Create New HR (Admin)
  const handleCreateHR = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      newHrData.company_id = user.company_id;
      await hrManagerApi.createHr(newHrData);
      alert("Success: New account created successfully");
      setNewHrData({ name: "", email: "", role: "hr", password: "", company_id: 0 });
    } catch (error: any) {
      alert(`Error: ${error.message || "Failed to create account"}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-screen items-center justify-center bg-muted/30">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">
              Manage your profile, security, and administrative tools.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* 1. Update Profile Card */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Profile Details
                </CardTitle>
                <CardDescription>
                  Update your public profile information.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 px-6 py-4 border-t flex justify-end">
                  <Button type="submit" disabled={saving} variant="outline">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Profile
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* 2. Security / Password Update Card */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Security
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure.
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdatePassword}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-muted/50 px-6 py-4 border-t flex justify-end">
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
                    Update Password
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* 3. Admin Zone: Create HR (Admin Only) */}
            {user?.role === "admin" && (
              <Card className="border-border shadow-sm border-l-4 border-l-blue-600">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Team Management (Admin)
                  </CardTitle>
                  <CardDescription>
                    Create new administrative or HR accounts.
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleCreateHR}>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-name">New User Name</Label>
                        <Input
                          id="new-name"
                          value={newHrData.name}
                          onChange={(e) => setNewHrData({ ...newHrData, name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-email">New User Email</Label>
                        <Input
                          id="new-email"
                          type="email"
                          value={newHrData.email}
                          onChange={(e) => setNewHrData({ ...newHrData, email: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hr-password">Temporary Password</Label>
                        <Input
                          id="hr-password"
                          type="password"
                          value={newHrData.password || ""}
                          onChange={(e) => setNewHrData({ ...newHrData, password: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-role">Assign Role</Label>
                        <Select
                          value={newHrData.role}
                          onValueChange={(val) => setNewHrData({ ...newHrData, role: val })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hr">HR</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/50 px-6 py-4 border-t flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                      Create Account
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            )}

            <Separator className="my-6" />

            {/* 4. Integrations */}
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">Account Integrations</CardTitle>
                <CardDescription>
                  Connect third-party services.
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