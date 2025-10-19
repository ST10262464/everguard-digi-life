import { Shield, ShieldAlert, ShieldCheck, ShieldOff, Clock, User, MapPin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Audit Timeline Component
 * Visual timeline of all access attempts (granted, denied, blocked)
 * Shows comprehensive audit trail with icons and color coding
 */

interface AuditEvent {
  id?: string;
  eventType?: string;
  attemptType?: string;
  capsuleId: string;
  accessorId?: string;
  requesterId?: string;
  timestamp: number;
  status?: string;
  denied?: boolean;
  reason?: string;
  burstId?: string;
  existingBurstKeyId?: string;
  context?: {
    location?: string;
    deviceId?: string;
  };
}

interface AuditTimelineProps {
  events: AuditEvent[];
  className?: string;
}

const EVENT_CONFIG = {
  BURST_KEY_ISSUED: {
    icon: ShieldCheck,
    color: "text-green-600",
    bgColor: "bg-green-100",
    borderColor: "border-green-300",
    label: "Full Access Granted",
    badgeVariant: "default" as const
  },
  BURST_KEY_CONSUMED: {
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    borderColor: "border-blue-300",
    label: "Data Accessed",
    badgeVariant: "default" as const
  },
  RESTRICTED_ACCESS_ATTEMPT: {
    icon: ShieldAlert,
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    borderColor: "border-orange-300",
    label: "ICE View Only",
    badgeVariant: "secondary" as const
  },
  ACTIVE_KEY_BLOCKED: {
    icon: ShieldOff,
    color: "text-red-600",
    bgColor: "bg-red-100",
    borderColor: "border-red-300",
    label: "Duplicate Blocked",
    badgeVariant: "destructive" as const
  }
};

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

export function AuditTimeline({ events, className }: AuditTimelineProps) {
  if (!events || events.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Access Audit Trail</CardTitle>
          <CardDescription>No access attempts recorded yet</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Sort events by timestamp (newest first)
  const sortedEvents = [...events].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Access Audit Trail
        </CardTitle>
        <CardDescription>
          Complete timeline of all access attempts ({events.length} events)
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {sortedEvents.map((event, index) => {
              const eventType = event.eventType || event.attemptType || 'UNKNOWN';
              const config = EVENT_CONFIG[eventType as keyof typeof EVENT_CONFIG] || EVENT_CONFIG.RESTRICTED_ACCESS_ATTEMPT;
              const Icon = config.icon;
              const accessor = event.accessorId || event.requesterId || 'Unknown';

              return (
                <div
                  key={event.id || index}
                  className={`relative pl-8 pb-8 ${index === sortedEvents.length - 1 ? 'pb-0' : ''}`}
                >
                  {/* Timeline line */}
                  {index < sortedEvents.length - 1 && (
                    <div className="absolute left-[15px] top-[40px] w-[2px] h-full bg-gray-200" />
                  )}
                  
                  {/* Event icon */}
                  <div className={`absolute left-0 top-0 p-2 rounded-full ${config.bgColor} border-2 ${config.borderColor}`}>
                    <Icon className={`h-4 w-4 ${config.color}`} />
                  </div>

                  {/* Event card */}
                  <div className={`ml-4 p-4 rounded-lg border-2 ${config.borderColor} ${config.bgColor} bg-opacity-50`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={config.badgeVariant} className="text-xs">
                          {config.label}
                        </Badge>
                        {event.status && (
                          <Badge variant="outline" className="text-xs">
                            {event.status}
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {/* Accessor */}
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {accessor}
                        </span>
                      </div>

                      {/* Location */}
                      {event.context?.location && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          {event.context.location}
                        </div>
                      )}

                      {/* BurstKey ID */}
                      {event.burstId && (
                        <div className="text-xs text-gray-600">
                          Key ID: <code className="bg-white px-2 py-1 rounded">{event.burstId}</code>
                        </div>
                      )}

                      {/* Reason for denial/blocking */}
                      {(event.reason || event.existingBurstKeyId) && (
                        <div className="mt-2 p-2 bg-white rounded text-xs text-gray-700">
                          {event.reason || `Blocked by existing key: ${event.existingBurstKeyId}`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

export default AuditTimeline;


