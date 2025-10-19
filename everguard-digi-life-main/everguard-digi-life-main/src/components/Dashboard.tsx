import { useState } from "react";
import { VaultCard } from "./VaultCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

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
  CheckCircle2
} from "lucide-react";

interface DashboardProps {
  onCapsuleClick: (capsuleType: string) => void;
}

export const Dashboard = ({ onCapsuleClick }: DashboardProps) => {
  const { t } = useTranslation();
  const [vaultStatus] = useState<"secure" | "warning">("secure");
  const navigate = useNavigate(); 
  const capsules = [
    {
      id: "medical",
      title: t('capsules.medical'),
      icon: Heart,
      gradient: "medical-gradient",
      lastAccess: "2 hours ago"
    },
    {
      id: "legal",
      title: t('capsules.legal'),
      icon: Scale,
      gradient: "legal-gradient",
      lastAccess: "3 days ago"
    },
    {
      id: "financial",
      title: t('capsules.financial'),
      icon: Wallet,
      gradient: "financial-gradient",
      lastAccess: "1 day ago"
    },
    {
      id: "education",
      title: t('capsules.education'),
      icon: GraduationCap,
      gradient: "medical-gradient",
      lastAccess: "5 days ago"
    },
    {
      id: "safety",
      title: t('capsules.safety'),
      icon: Shield,
      gradient: "emergency-gradient",
      lastAccess: "Never"
    },
    {
      id: "legacy",
      title: t('capsules.legacy'),
      icon: HeartLegacy,
      gradient: "legal-gradient",
      lastAccess: "1 week ago"
    }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="font-heading font-bold text-4xl mb-2">{t('dashboard.title')}</h1>
              <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
            </div>
            
            <Badge 
              variant={vaultStatus === "secure" ? "default" : "destructive"}
              className="flex items-center gap-2 px-4 py-2 text-sm vault-gradient border-0 text-white"
            >
              {vaultStatus === "secure" ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t('dashboard.secure')}
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  {t('dashboard.actionRequired')}
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Capsules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capsules.map((capsule, index) => (
            <div 
              key={capsule.id}
              style={{ animationDelay: `${index * 0.1}s` }}
              className="animate-fade-in"
            >
              <VaultCard
                title={capsule.title}
                icon={capsule.icon}
                gradient={capsule.gradient}
                lastAccess={capsule.lastAccess}
                onClick={() => onCapsuleClick(capsule.id)}
              />
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

            {/* AI Guardian */}
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 px-6 hover:bg-muted transition-smooth"
              onClick={() => navigate("/ai")} // <-- navigate to AI page
            >
              <Bot className="w-5 h-5 mr-3 text-primary" />
              <div className="text-left">
                <div className="font-semibold">AI Guardian</div>
                <div className="text-xs text-muted-foreground">Get assistance</div>
              </div>
            </Button>


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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
          <div className="p-6 bg-card rounded-2xl border border-border">
            <div className="text-3xl font-bold text-primary mb-1">0</div>
            <div className="text-sm text-muted-foreground">Security Breaches</div>
          </div>
          <div className="p-6 bg-card rounded-2xl border border-border">
            <div className="text-3xl font-bold text-primary mb-1">24</div>
            <div className="text-sm text-muted-foreground">Verified Access Events</div>
          </div>
          <div className="p-6 bg-card rounded-2xl border border-border">
            <div className="text-3xl font-bold text-primary mb-1">2h</div>
            <div className="text-sm text-muted-foreground">Last Sync</div>
          </div>
        </div>
      </div>
    </div>
  );
};
