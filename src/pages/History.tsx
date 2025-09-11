import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TripCard from "@/components/TripCard";
import { Trip } from "@/types/trip";
import { format } from "date-fns";

const History = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Mock data
  const trips: Trip[] = [
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
      isConfirmed: false,
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
    {
      id: "4",
      origin: { name: "Home" },
      destination: { name: "Gym" },
      startTime: new Date("2024-01-14T06:00:00"),
      endTime: new Date("2024-01-14T06:30:00"),
      mode: "bike",
      purpose: "personal",
      companion: "alone",
      distance: 5.0,
      duration: 30,
      isAutoDetected: true,
      isConfirmed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = 
      trip.origin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trip.destination.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "unconfirmed") {
      return matchesSearch && !trip.isConfirmed;
    }
    
    return matchesSearch;
  });

  // Group trips by date
  const groupedTrips = filteredTrips.reduce((groups, trip) => {
    const date = format(trip.startTime, "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(trip);
    return groups;
  }, {} as Record<string, Trip[]>);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-ocean text-white p-4">
        <h1 className="text-xl font-semibold mb-4">Trip History</h1>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
          <Input
            type="text"
            placeholder="Search trips..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-white/60"
          />
        </div>
      </header>

      <div className="p-4">
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">
              All Trips ({trips.length})
            </TabsTrigger>
            <TabsTrigger value="unconfirmed">
              Unconfirmed ({trips.filter(t => !t.isConfirmed).length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filter Button */}
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>

        {/* Grouped Trips */}
        <div className="space-y-6">
          {Object.entries(groupedTrips).map(([date, dateTrips]) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-muted-foreground">
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </h3>
              </div>
              <div className="space-y-3">
                {dateTrips.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    onClick={() => navigate(`/trip/${trip.id}`)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredTrips.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No trips found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;