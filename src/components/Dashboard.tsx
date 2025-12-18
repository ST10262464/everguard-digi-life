import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { VaultCard } from "./VaultCard";
import { CapsuleCreationForm } from "./CapsuleCreationForm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Scale, 
  Wallet, 
  GraduationCap, 
  Shield, 
  Heart as HeartLegacy,
  MapPin,
  Bot,
  FileCheck,
  AlertCircle,
  CheckCircle2,
  LogOut,
  Settings
} from "lucide-react";

import { API_URL } from '@/config/api';

interface DashboardProps {
  onCapsuleClick: (capsule: any) => void;
}

export const Dashboard = ({ onCapsuleClick }: DashboardProps) => {
  const { user, token, logout } = useAuth();
  const [vaultStatus] = useState<"secure" | "warning">("secure");
  const [userCapsules, setUserCapsules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreationForm, setShowCreationForm] = useState(false);

  // Fetch user capsules on mount
  useEffect(() => {
    const fetchUserCapsules = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const headers: any = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_URL}/api/capsules`, {
          headers
        });

        if (response.ok) {
          const data = await response.json();
          setUserCapsules(data.capsules || []);
          
          // If no capsules, show creation form
          if (!data.capsules || data.capsules.length === 0) {
            setShowCreationForm(true);
          }
        }
      } catch (error) {
        console.error('Error fetching capsules:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCapsules();
  }, [user, token]);

  const handleCapsuleCreated = () => {
    setShowCreationForm(false);
    // Refresh capsules
    window.location.reload();
  };

  // Demo capsules for non-authenticated users (excluding medical since user has real one)
  const capsules = [
    {
      id: "legal",
      title: "Legal & Will",
      icon: Scale,
      gradient: "legal-gradient"
    },
    {
      id: "financial",
      title: "Financial",
      icon: Wallet,
      gradient: "financial-gradient"
    },
    {
      id: "education",
      title: "Education",
      icon: GraduationCap,
      gradient: "medical-gradient"
    },
    {
      id: "safety",
      title: "Safety & GBV",
      icon: Shield,
      gradient: "emergency-gradient"
    },
    {
      id: "legacy",
      title: "Legacy",
      icon: HeartLegacy,
      gradient: "legal-gradient"
    }
  ];

  // Show creation form for authenticated users without capsules
  if (user && showCreationForm) {
    return <CapsuleCreationForm onSuccess={handleCapsuleCreated} />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-heading font-bold text-4xl mb-2">
                {user ? `${user.name}'s Vault` : 'Your Vault'}
              </h1>
              <p className="text-muted-foreground">
                {user ? `Welcome back, ${user.name}` : 'Manage your secure data capsules'}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (user.role === 'admin') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/admin'}
                  className="gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Admin
                </Button>
              )}
              
              {user && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </Button>
              )}
              
              <Badge 
                variant={vaultStatus === "secure" ? "default" : "destructive"}
                className="flex items-center gap-2 px-4 py-2 text-sm vault-gradient border-0 text-white"
              >
                {vaultStatus === "secure" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Secure & Synced
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4" />
                    Action Required
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* Capsules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Show user's real capsules first if they exist */}
          {user && userCapsules.length > 0 && userCapsules.map((capsule, index) => (
            <div 
              key={capsule.id}
              style={{ animationDelay: `${index * 0.1}s` }}
              className="animate-fade-in"
            >
              <VaultCard
                title={capsule.metadata?.title || `${capsule.capsuleType} Capsule`}
                icon={Heart} // Default to medical icon for now
                gradient="medical-gradient"
                onClick={() => onCapsuleClick(capsule)}
              />
            </div>
          ))}
          
          {/* Always show demo capsules */}
          {capsules.map((capsule, index) => (
            <div 
              key={capsule.id}
              style={{ animationDelay: `${(userCapsules.length + index) * 0.1}s` }}
              className="animate-fade-in"
            >
              {['education','safety','financial'].includes(capsule.id) ? (
                <VaultCard
                  title={capsule.title}
                  icon={capsule.icon}
                  gradient={capsule.gradient}
                  onClick={() => {
                    if (capsule.id === 'education') {
                      window.location.href = '/education';
                    } else if (capsule.id === 'safety') {
                      window.location.href = '/safety';
                    } else if (capsule.id === 'financial') {
                      window.location.href = '/financial';
                    }
                  }}
                />
              ) : (
                <VaultCard
                  title={capsule.title}
                  icon={capsule.icon}
                  gradient={capsule.gradient}
                  onClick={() => onCapsuleClick(capsule.id)}
                />
              )}
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="pt-8 border-t border-border">
          <h2 className="font-heading font-semibold text-xl mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 px-6 hover:bg-muted transition-smooth"
              onClick={() => onCapsuleClick("emergency")}
            >
              <AlertCircle className="w-5 h-5 mr-3 text-accent" />
              <div className="text-left">
                <div className="font-semibold">Emergency Access</div>
                <div className="text-xs text-muted-foreground">Quick medical info</div>
              </div>
            </Button>

            <a href="/ai">
              <Button 
                variant="outline" 
                className="justify-start h-auto py-4 px-6 hover:bg-muted transition-smooth"
              >
                <Bot className="w-5 h-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-semibold">AI Guardian</div>
                  <div className="text-xs text-muted-foreground">Get assistance</div>
                </div>
              </Button>
            </a>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 px-6 hover:bg-muted transition-smooth"
            >
              <MapPin className="w-5 h-5 mr-3 text-secondary" />
              <div className="text-left">
                <div className="font-semibold">Aid Map</div>
                <div className="text-xs text-muted-foreground">Find nearby help</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 px-6 hover:bg-muted transition-smooth"
            >
              <FileCheck className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-semibold">Compliance</div>
                <div className="text-xs text-muted-foreground">View access logs</div>
              </div>
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};
