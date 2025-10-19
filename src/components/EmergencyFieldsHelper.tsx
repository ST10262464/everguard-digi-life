import { Info, Phone, User, Heart, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

/**
 * Emergency Fields Helper Component
 * Auto-suggests critical emergency information fields
 * Provides guidance on what to include in medical capsules
 */

interface EmergencyField {
  id: string;
  label: string;
  icon: any;
  description: string;
  example: string;
  critical: boolean;
}

const SUGGESTED_FIELDS: EmergencyField[] = [
  {
    id: "bloodType",
    label: "Blood Type",
    icon: Heart,
    description: "Your blood type (critical for transfusions)",
    example: "A+, O-, AB+, etc.",
    critical: true
  },
  {
    id: "allergies",
    label: "Allergies",
    icon: AlertTriangle,
    description: "Life-threatening allergies (drugs, foods, etc.)",
    example: "Penicillin, Peanuts, Bee stings",
    critical: true
  },
  {
    id: "medications",
    label: "Current Medications",
    icon: Heart,
    description: "Medications you're currently taking",
    example: "Aspirin, Insulin, Blood thinners",
    critical: true
  },
  {
    id: "conditions",
    label: "Medical Conditions",
    icon: AlertTriangle,
    description: "Chronic conditions medics should know about",
    example: "Diabetes, Hypertension, Epilepsy",
    critical: true
  },
  {
    id: "emergencyContact",
    label: "Emergency Contact",
    icon: Phone,
    description: "Primary emergency contact person",
    example: "Name, Phone, Relationship",
    critical: true
  },
  {
    id: "ownerName",
    label: "Patient Name",
    icon: User,
    description: "Your full name",
    example: "John Doe",
    critical: false
  }
];

interface EmergencyFieldsHelperProps {
  onFieldClick?: (fieldId: string) => void;
  className?: string;
}

export function EmergencyFieldsHelper({ onFieldClick, className }: EmergencyFieldsHelperProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          Recommended Emergency Information
        </CardTitle>
        <CardDescription>
          Include these critical fields to ensure proper emergency care
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Pro Tip:</strong> More complete information helps emergency responders make better decisions faster.
          </AlertDescription>
        </Alert>

        <div className="grid gap-3">
          {SUGGESTED_FIELDS.map((field) => {
            const Icon = field.icon;
            return (
              <button
                key={field.id}
                onClick={() => onFieldClick?.(field.id)}
                className="w-full text-left p-4 rounded-lg border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-blue-100 group-hover:bg-blue-200 transition-colors">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {field.label}
                      </h4>
                      {field.critical && (
                        <Badge variant="destructive" className="text-xs">
                          CRITICAL
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-1">
                      {field.description}
                    </p>
                    
                    <p className="text-xs text-gray-500 italic">
                      Example: {field.example}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <Alert className="bg-orange-50 border-orange-200">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-900">
            <strong>Privacy Note:</strong> Emergency contacts are visible to everyone via ICE view. 
            Full medical data requires verified medical professional credentials.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export { SUGGESTED_FIELDS };
export default EmergencyFieldsHelper;


