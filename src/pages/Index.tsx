import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Welcome } from "@/components/Welcome";
import { Dashboard } from "@/components/Dashboard";
import { CapsuleDetail } from "@/components/CapsuleDetail";
import { UserRoleSwitcher, DEMO_USERS, UserRole } from "@/components/UserRoleSwitcher";

type ViewType = "welcome" | "dashboard" | "capsule";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [currentView, setCurrentView] = useState<ViewType>("welcome");
  const [selectedCapsule, setSelectedCapsule] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<UserRole>(DEMO_USERS[1]); // Default to Dr. Joe
  const [demoMode, setDemoMode] = useState(false);

  // If user is authenticated, skip welcome and go to dashboard
  useEffect(() => {
    if (user && !authLoading) {
      setCurrentView("dashboard");
      setDemoMode(false);
    }
  }, [user, authLoading]);

  const handleGetStarted = () => {
    // Demo mode - use user switcher
    setDemoMode(true);
    setCurrentView("dashboard");
  };

  const handleCapsuleClick = (capsule: any) => {
    if (typeof capsule === "string" && capsule === "emergency") {
      // Navigate to QR scanner page for emergency access
      navigate("/emergency-scan");
    } else if (typeof capsule === "object" && capsule.id) {
      // Real capsule object - pass to detail view
      setSelectedCapsule(capsule);
      setCurrentView("capsule");
    } else if (typeof capsule === "string") {
      // Demo capsule type string
      setSelectedCapsule(capsule);
      setCurrentView("capsule");
    }
  };

  const handleBack = () => {
    setCurrentView("dashboard");
    setSelectedCapsule("");
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {currentView === "welcome" && (
        <Welcome 
          onGetStarted={handleGetStarted} 
          showAuth={!user && !demoMode}
        />
      )}
      
      {currentView === "dashboard" && (
        <div className="relative">
          {/* Floating User Switcher - only show in demo mode */}
          {demoMode && (
            <div className="fixed top-4 right-4 z-50">
              <UserRoleSwitcher 
                currentUser={currentUser}
                onUserChange={setCurrentUser}
                compact={true}
              />
            </div>
          )}
          
          <Dashboard onCapsuleClick={handleCapsuleClick} />
        </div>
      )}
      
      {currentView === "capsule" && (
        <div className="relative">
          {/* Floating User Switcher - only show in demo mode */}
          {demoMode && (
            <div className="fixed top-4 right-4 z-50">
              <UserRoleSwitcher 
                currentUser={currentUser}
                onUserChange={setCurrentUser}
                compact={true}
              />
            </div>
          )}
          
          <CapsuleDetail 
            capsule={selectedCapsule}
            onBack={handleBack}
          />
        </div>
      )}
    </>
  );
};

export default Index;
