import { CheckCircle, Clock, XCircle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

/**
 * BurstKey Status Badge Component
 * Visual indicators for BurstKey status (active, consumed, expired)
 * Shows color-coded badges with icons and tooltips
 */

export type BurstKeyStatus = 'active' | 'consumed' | 'expired';

interface BurstKeyStatusBadgeProps {
  status: BurstKeyStatus;
  expiresAt?: number;
  consumedAt?: number;
  size?: 'sm' | 'default' | 'lg';
  showTooltip?: boolean;
}

const STATUS_CONFIG = {
  active: {
    icon: Shield,
    label: "Active",
    color: "bg-green-100 text-green-800 border-green-300",
    tooltip: "This key is currently active and can be used to access medical data"
  },
  consumed: {
    icon: CheckCircle,
    label: "Consumed",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    tooltip: "This key has been used and can no longer access medical data"
  },
  expired: {
    icon: XCircle,
    label: "Expired",
    color: "bg-gray-100 text-gray-800 border-gray-300",
    tooltip: "This key has expired and can no longer be used"
  }
};

function getTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const remaining = expiresAt - now;
  
  if (remaining <= 0) return "Expired";
  
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s remaining`;
  }
  return `${seconds}s remaining`;
}

export function BurstKeyStatusBadge({
  status,
  expiresAt,
  consumedAt,
  size = 'default',
  showTooltip = true
}: BurstKeyStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    default: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5"
  };

  const badge = (
    <Badge 
      variant="outline"
      className={`${config.color} border-2 ${sizeClasses[size]} font-semibold flex items-center gap-1.5`}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
      {status === 'active' && expiresAt && (
        <Clock className={`${iconSizes[size]} ml-1`} />
      )}
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  let tooltipContent = config.tooltip;
  
  if (status === 'active' && expiresAt) {
    tooltipContent = `${config.tooltip}\n\n${getTimeRemaining(expiresAt)}`;
  } else if (status === 'consumed' && consumedAt) {
    const date = new Date(consumedAt);
    tooltipContent = `${config.tooltip}\n\nConsumed at: ${date.toLocaleString()}`;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="whitespace-pre-line">{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default BurstKeyStatusBadge;


