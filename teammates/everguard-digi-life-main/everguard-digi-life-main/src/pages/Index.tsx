import { useState } from "react";
import { Welcome } from "@/components/Welcome";
import { Dashboard } from "@/components/Dashboard";
import { CapsuleDetail } from "@/components/CapsuleDetail";
import { EmergencyAccess } from "@/components/EmergencyAccess";

type ViewType = "welcome" | "dashboard" | "capsule" | "emergency";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>("welcome");
  const [selectedCapsule, setSelectedCapsule] = useState<string>("");

  const handleGetStarted = () => {
    setCurrentView("dashboard");
  };

  const handleCapsuleClick = (capsuleType: string) => {
    if (capsuleType === "emergency") {
      setCurrentView("emergency");
    } else {
      setSelectedCapsule(capsuleType);
      setCurrentView("capsule");
    }
  };

    const handleAssistantClick = (capsuleType: string) => {
    if (capsuleType === "emergency") {
      setCurrentView("emergency");
    } else {
      setSelectedCapsule(capsuleType);
      setCurrentView("capsule");
    }
  };

  const handleBack = () => {
    setCurrentView("dashboard");
    setSelectedCapsule("");
  };

  return (
    <>
      {currentView === "welcome" && (
        <Welcome onGetStarted={handleGetStarted} />
      )}
      
      {currentView === "dashboard" && (
        <Dashboard onCapsuleClick={handleCapsuleClick} />
      )}
      
      {currentView === "capsule" && (
        <CapsuleDetail 
          capsuleType={selectedCapsule}
          onBack={handleBack}
        />
      )}
      
      {currentView === "emergency" && (
        <EmergencyAccess onBack={handleBack} />
      )}
    </>
  );
};

export default Index;
