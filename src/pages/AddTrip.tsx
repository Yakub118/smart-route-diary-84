import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Users, Briefcase, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TransportMode, TripPurpose, Companion } from "@/types/trip";

const AddTrip = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    date: new Date().toISOString().split('T')[0],
    startTime: "",
    endTime: "",
    mode: "" as TransportMode,
    purpose: "" as TripPurpose,
    companion: "alone" as Companion,
    distance: "",
    notes: "",
  });

  const transportModes: { value: TransportMode; label: string; icon: string }[] = [
    { value: "walk", label: "Walking", icon: "🚶" },
    { value: "car", label: "Car", icon: "🚗" },
    { value: "bus", label: "Bus", icon: "🚌" },
    { value: "train", label: "Train", icon: "🚂" },
    { value: "bike", label: "Bicycle", icon: "🚴" },
    { value: "other", label: "Other", icon: "🚕" },
  ];

  const purposes: { value: TripPurpose; label: string; icon: string }[] = [
    { value: "work", label: "Work", icon: "💼" },
    { value: "education", label: "Education", icon: "📚" },
    { value: "shopping", label: "Shopping", icon: "🛍️" },
    { value: "leisure", label: "Leisure", icon: "🎭" },
    { value: "personal", label: "Personal", icon: "👤" },
    { value: "medical", label: "Medical", icon: "🏥" },
    { value: "other", label: "Other", icon: "📍" },
  ];

  const companions: { value: Companion; label: string }[] = [
    { value: "alone", label: "Alone" },
    { value: "family", label: "Family" },
    { value: "friends", label: "Friends" },
    { value: "colleagues", label: "Colleagues" },
    { value: "other", label: "Other" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.origin || !formData.destination || !formData.startTime || !formData.endTime || !formData.mode || !formData.purpose) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Here you would normally save to database
    toast.success("Trip added successfully!");
    navigate("/history");
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-gradient-ocean text-white p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Add New Trip</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Location Section */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Location Details</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="origin">Origin *</Label>
              <Input
                id="origin"
                placeholder="Enter starting location"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="destination">Destination *</Label>
              <Input
                id="destination"
                placeholder="Enter destination"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="distance">Distance (km)</Label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                placeholder="Optional"
                value={formData.distance}
                onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Time Section */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Time Details</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Transport Mode */}
        <Card className="p-4">
          <Label>Mode of Transport *</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {transportModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setFormData({ ...formData, mode: mode.value })}
                className={`p-3 rounded-lg border-2 transition-all ${
                  formData.mode === mode.value
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="text-2xl mb-1">{mode.icon}</div>
                <div className="text-xs">{mode.label}</div>
              </button>
            ))}
          </div>
        </Card>

        {/* Trip Details */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Trip Details</h2>
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="purpose">Purpose *</Label>
              <Select value={formData.purpose} onValueChange={(value) => setFormData({ ...formData, purpose: value as TripPurpose })}>
                <SelectTrigger id="purpose">
                  <SelectValue placeholder="Select purpose" />
                </SelectTrigger>
                <SelectContent>
                  {purposes.map((purpose) => (
                    <SelectItem key={purpose.value} value={purpose.value}>
                      <span className="flex items-center gap-2">
                        <span>{purpose.icon}</span>
                        <span>{purpose.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="companion">Travel Companion</Label>
              <Select value={formData.companion} onValueChange={(value) => setFormData({ ...formData, companion: value as Companion })}>
                <SelectTrigger id="companion">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companions.map((companion) => (
                    <SelectItem key={companion.value} value={companion.value}>
                      {companion.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any additional information..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <Button type="submit" variant="ocean" size="lg" className="w-full">
          <Save className="mr-2 h-5 w-5" />
          Save Trip
        </Button>
      </form>
    </div>
  );
};

export default AddTrip;