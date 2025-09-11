import { User, Shield, Bell, LogOut } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

const Profile = () => {
  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    window.location.href = "/onboarding";
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-ocean text-white p-4">
        <h1 className="text-xl font-semibold">Profile</h1>
      </header>

      <div className="p-4 space-y-4">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-16 w-16 bg-gradient-sunset rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Research Participant</h2>
              <p className="text-sm text-muted-foreground">ID: USER-2024-001</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy Settings
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Share location data</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Share trip purposes</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Anonymous mode</span>
              <Switch />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Trip reminders</span>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Weekly summaries</span>
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;