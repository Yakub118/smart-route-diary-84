import { useState } from "react";
import { Shield, Trash2, Eye, EyeOff, Download, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

interface PrivacySettingsProps {
  currentShareMode?: 'full' | 'anonymous';
  onShareModeChange?: (mode: 'full' | 'anonymous') => void;
  onDeleteAllData?: () => void;
  onExportData?: () => void;
  tripCount: number;
}

const PrivacySettings = ({ 
  currentShareMode = 'full',
  onShareModeChange,
  onDeleteAllData,
  onExportData,
  tripCount 
}: PrivacySettingsProps) => {
  const { toast } = useToast();
  const [shareMode, setShareMode] = useState(currentShareMode);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleShareModeToggle = (enabled: boolean) => {
    const newMode = enabled ? 'anonymous' : 'full';
    setShareMode(newMode);
    onShareModeChange?.(newMode);
    
    toast({
      title: "Privacy settings updated",
      description: enabled 
        ? "Your data will now be stored anonymously" 
        : "Your data will be linked to your account",
    });
  };

  const handleDeleteData = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAllData?.();
      toast({
        title: "Data deleted successfully",
        description: "All your trip data has been permanently removed",
      });
    } catch (error) {
      toast({
        title: "Error deleting data",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = () => {
    onExportData?.();
    toast({
      title: "Data export started", 
      description: "Your data download will begin shortly",
    });
  };

  return (
    <div className="space-y-6">
      {/* Privacy Overview */}
      <Card className="p-4 bg-gradient-card shadow-card">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold mb-1">Privacy & Data Control</h2>
            <p className="text-sm text-muted-foreground">
              Manage how your travel data is stored and shared. You have full control over your privacy.
            </p>
          </div>
        </div>
      </Card>

      {/* Data Sharing Settings */}
      <Card className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="anonymous-mode" className="text-sm font-medium">
                  Anonymous Data Sharing
                </Label>
                <Badge variant={shareMode === 'anonymous' ? 'default' : 'secondary'}>
                  {shareMode === 'anonymous' ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Store your trips without linking them to your personal identity
              </p>
            </div>
            <Switch
              id="anonymous-mode"
              checked={shareMode === 'anonymous'}
              onCheckedChange={handleShareModeToggle}
            />
          </div>

          <Separator />

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              {shareMode === 'anonymous' ? (
                <EyeOff className="h-4 w-4 text-mode-walk" />
              ) : (
                <Eye className="h-4 w-4 text-primary" />
              )}
              <span className="font-medium">Current Mode: </span>
              <span className={shareMode === 'anonymous' ? 'text-mode-walk' : 'text-primary'}>
                {shareMode === 'anonymous' ? 'Anonymous' : 'Full Profile'}
              </span>
            </div>
            
            <div className="pl-6 space-y-1 text-xs text-muted-foreground">
              {shareMode === 'anonymous' ? (
                <>
                  <p>• Trips are stored with random identifiers</p>
                  <p>• No personal information is linked to your data</p>
                  <p>• Statistics are aggregated anonymously</p>
                  <p>• Data cannot be traced back to you</p>
                </>
              ) : (
                <>
                  <p>• Trips are linked to your user account</p>
                  <p>• Full personalization and history available</p>
                  <p>• Better recommendations and insights</p>
                  <p>• Data syncs across devices</p>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">Data Management</h3>
        
        <div className="space-y-4">
          {/* Data Summary */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm">
              <p className="font-medium mb-1">Your Data Summary</p>
              <p className="text-muted-foreground">
                You currently have <span className="font-medium text-foreground">{tripCount} trips</span> stored in our system.
              </p>
            </div>
          </div>

          {/* Export Data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export Your Data</p>
              <p className="text-xs text-muted-foreground">
                Download all your trip data in JSON format
              </p>
            </div>
            <Button variant="outline" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          <Separator />

          {/* Delete All Data */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Delete All Data</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove all your trips and statistics
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Delete All Data
                  </AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2">
                    <p>
                      This will permanently delete all your trip data, including:
                    </p>
                    <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                      <li>{tripCount} trip records</li>
                      <li>All travel statistics</li>
                      <li>Personal preferences</li>
                      <li>Trip history and patterns</li>
                    </ul>
                    <p className="font-semibold text-destructive">
                      This action cannot be undone.
                    </p>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteData}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Deleting..." : "Delete Everything"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </Card>

      {/* Legal Information */}
      <Card className="p-4 border-muted">
        <h4 className="text-sm font-medium mb-2">Privacy Information</h4>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• We never share your personal data with third parties</p>
          <p>• All data is encrypted and stored securely</p>
          <p>• You can request data deletion at any time</p>
          <p>• Anonymous mode ensures complete privacy</p>
        </div>
      </Card>
    </div>
  );
};

export default PrivacySettings;