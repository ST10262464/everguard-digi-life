import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface VaultCardProps {
  title: string;
  icon: LucideIcon;
  gradient: string;
  lastAccess?: string;
  onClick?: () => void;
}

export const VaultCard = ({ title, icon: Icon, gradient, lastAccess, onClick }: VaultCardProps) => {
  return (
    <Card 
      className={`${gradient} p-6 cursor-pointer transition-smooth hover:scale-105 card-shadow border-0 text-white group relative overflow-hidden`}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-smooth" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
            <Icon className="w-6 h-6" />
          </div>
        </div>
        
        <h3 className="font-heading font-semibold text-xl mb-2">{title}</h3>
        
        {lastAccess && (
          <p className="text-sm text-white/80">
            Last access: {lastAccess}
          </p>
        )}
      </div>
    </Card>
  );
};
