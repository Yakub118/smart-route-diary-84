import { useState } from "react";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TravelChainView from "@/components/TravelChainView";
import EnhancedStats from "@/components/EnhancedStats";
import PrivacySettings from "@/components/PrivacySettings";
import { Trip } from "@/types/trip";

const Stats = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - in real app, this would come from Supabase
  const mockTrips: Trip[] = [
    {
      id: "1",
      origin: { name: "Home" },
      destination: { name: "Office" },
      startTime: new Date("2024-01-15T08:30:00"),
      endTime: new Date("2024-01-15T09:15:00"),
      mode: "bus",
      purpose: "work",
      companion: "alone",
      distance: 12.5,
      duration: 45,
      isAutoDetected: true,
      isConfirmed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      origin: { name: "Office" },
      destination: { name: "Mall" },
      startTime: new Date("2024-01-15T18:00:00"),
      endTime: new Date("2024-01-15T18:30:00"),
      mode: "car",
      purpose: "shopping",
      companion: "family",
      distance: 8.2,
      duration: 30,
      isAutoDetected: false,
      isConfirmed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      origin: { name: "Mall" },
      destination: { name: "Restaurant" },
      startTime: new Date("2024-01-14T19:00:00"),
      endTime: new Date("2024-01-14T19:20:00"),
      mode: "walk",
      purpose: "leisure",
      companion: "family",
      distance: 1.5,
      duration: 20,
      isAutoDetected: false,
      isConfirmed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const handleExportData = () => {
    const dataStr = JSON.stringify(mockTrips, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trip-data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAllData = async () => {
    // In real app, this would delete from Supabase
    console.log("Delete all data");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="bg-gradient-ocean text-white p-4">
        <h1 className="text-xl font-semibold mb-4">Analytics & Insights</h1>
      </header>

      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <EnhancedStats trips={mockTrips} />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Daily Travel Chain</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedDate(new Date())}
                size="sm"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Today
              </Button>
            </div>
            <TravelChainView trips={mockTrips} selectedDate={selectedDate} />
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <EnhancedStats trips={mockTrips} />
          </TabsContent>

          <TabsContent value="privacy" className="space-y-4">
            <PrivacySettings
              tripCount={mockTrips.length}
              onExportData={handleExportData}
              onDeleteAllData={handleDeleteAllData}
              currentShareMode="full"
              onShareModeChange={(mode) => console.log("Share mode:", mode)}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Stats;