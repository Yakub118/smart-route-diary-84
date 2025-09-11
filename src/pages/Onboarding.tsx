import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Shield, BarChart3, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Onboarding = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [consent, setConsent] = useState(false);

  const steps = [
    {
      icon: <MapPin className="h-12 w-12 text-primary" />,
      title: "Track Your Journeys",
      description: "Automatically detect and log your daily trips using GPS and smart sensors.",
      image: "🗺️",
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-accent" />,
      title: "Contribute to Research",
      description: "Your anonymized travel data helps NATPAC improve transportation planning for everyone.",
      image: "📊",
    },
    {
      icon: <Shield className="h-12 w-12 text-mode-walk" />,
      title: "Your Privacy Matters",
      description: "We only collect trip data needed for research. You control what you share.",
      image: "🔒",
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Navigate to consent screen
      setCurrentStep(steps.length);
    }
  };

  const handleConsent = () => {
    if (!consent) {
      toast.error("Please accept the terms to continue");
      return;
    }
    
    // Store consent and mark onboarding complete
    localStorage.setItem("onboardingComplete", "true");
    localStorage.setItem("userConsent", "true");
    toast.success("Welcome to TravelLog!");
    navigate("/");
  };

  if (currentStep === steps.length) {
    return (
      <div className="min-h-screen bg-gradient-dawn flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-6 bg-card/95 backdrop-blur">
          <h2 className="text-2xl font-bold mb-4">Data Collection Consent</h2>
          <div className="space-y-4 mb-6">
            <p className="text-sm text-muted-foreground">
              By using TravelLog, you agree to share the following data for transportation research:
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Trip origin and destination locations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Travel times and durations</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Mode of transportation</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Trip purpose and companion information</span>
              </li>
            </ul>
            <Card className="p-4 bg-secondary border-primary/20">
              <p className="text-xs">
                <strong>Your privacy is protected:</strong> All data is anonymized and used solely for 
                improving public transportation planning. You can delete your data at any time.
              </p>
            </Card>
          </div>
          
          <div className="flex items-center gap-2 mb-6">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(checked) => setConsent(checked as boolean)}
            />
            <label
              htmlFor="consent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              I agree to share my travel data for research purposes
            </label>
          </div>
          
          <Button
            onClick={handleConsent}
            className="w-full"
            variant="ocean"
            size="lg"
          >
            Start Using TravelLog
          </Button>
        </Card>
      </div>
    );
  }

  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-sky flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{currentStepData.image}</div>
          <div className="flex justify-center mb-4">
            {currentStepData.icon}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentStepData.title}
          </h1>
          <p className="text-white/80">
            {currentStepData.description}
          </p>
        </div>
        
        <div className="flex gap-2 justify-center mb-8">
          {steps.map((_, index) => (
            <div
              key={index}
              className={cn(
                "h-2 w-12 rounded-full transition-all",
                index === currentStep ? "bg-white" : "bg-white/30"
              )}
            />
          ))}
        </div>
        
        <Button
          onClick={handleNext}
          variant="glass"
          size="xl"
          className="w-full"
        >
          {currentStep === steps.length - 1 ? "Get Started" : "Next"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default Onboarding;