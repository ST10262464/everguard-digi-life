import { Phone, AlertCircle, ShieldAlert, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

/**
 * ICE View Component
 * Displays restricted emergency contact information for non-verified users
 * Shows NO medical data - only emergency contact details
 */

interface IceData {
  capsuleId: string;
  capsuleType: string;
  ownerName: string;
  emergencyContact: {
    name: string;
    phone: string;
    relationship?: string;
  };
}

interface IceViewProps {
  iceData: IceData;
  message?: string;
  fullAccessRequires?: string;
}

export function IceView({ iceData, message, fullAccessRequires }: IceViewProps) {
  const handleCallEmergency = () => {
    if (iceData.emergencyContact?.phone) {
      window.location.href = `tel:${iceData.emergencyContact.phone}`;
    }
  };

  const handleCall911 = () => {
    window.location.href = 'tel:911';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header Alert */}
        <Alert className="border-orange-500 bg-orange-50">
          <ShieldAlert className="h-5 w-5 text-orange-600" />
          <AlertTitle className="text-orange-900 font-semibold">
            Limited Access - Emergency Contact Information Only
          </AlertTitle>
          <AlertDescription className="text-orange-800">
            {message || "You're viewing restricted emergency information. Full medical data requires verified medical professional credentials."}
          </AlertDescription>
        </Alert>

        {/* ICE Badge */}
        <div className="flex justify-center">
          <Badge variant="destructive" className="text-lg px-6 py-2">
            <AlertCircle className="mr-2 h-5 w-5" />
            ICE - IN CASE OF EMERGENCY
          </Badge>
        </div>

        {/* Main ICE Card */}
        <Card className="border-2 border-orange-300 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-100 to-red-100">
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              Emergency Contact Information
            </CardTitle>
            <CardDescription className="text-base">
              Patient: <span className="font-semibold text-gray-900">{iceData.ownerName || "Unknown"}</span>
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Emergency Contact Details */}
            {iceData.emergencyContact ? (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contact Name</h3>
                  <p className="text-xl font-semibold text-gray-900">
                    {iceData.emergencyContact.name}
                  </p>
                  {iceData.emergencyContact.relationship && (
                    <p className="text-sm text-gray-600 mt-1">
                      ({iceData.emergencyContact.relationship})
                    </p>
                  )}
                </div>

                <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Phone Number</h3>
                  <p className="text-2xl font-mono font-bold text-blue-600">
                    {iceData.emergencyContact.phone}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <Button 
                    size="lg" 
                    className="bg-blue-600 hover:bg-blue-700 h-16"
                    onClick={handleCallEmergency}
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Call Emergency Contact
                  </Button>
                  
                  <Button 
                    size="lg" 
                    variant="destructive"
                    className="h-16"
                    onClick={handleCall911}
                  >
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Call 911
                  </Button>
                </div>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>No Emergency Contact</AlertTitle>
                <AlertDescription>
                  No emergency contact information is available for this capsule.
                </AlertDescription>
              </Alert>
            )}

            {/* Medical Data Restricted Notice */}
            <Alert className="bg-gray-50 border-gray-300">
              <Info className="h-4 w-4 text-gray-600" />
              <AlertTitle className="text-gray-900">Medical Data Restricted</AlertTitle>
              <AlertDescription className="text-gray-700">
                <p className="mb-2">Full medical information (blood type, allergies, medications, conditions) is encrypted and requires:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Verified medical professional credentials</li>
                  <li>Time-limited access key (BurstKey)</li>
                  <li>Logged audit trail</li>
                </ul>
                {fullAccessRequires && (
                  <p className="mt-2 text-xs text-gray-600 italic">
                    {fullAccessRequires}
                  </p>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Capsule Info Footer */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                <span className="font-medium">Capsule ID:</span> {iceData.capsuleId}
              </div>
              <div>
                <span className="font-medium">Type:</span> {iceData.capsuleType}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">
              This access attempt has been logged for audit purposes. 
              EverGuard - Secure Medical Data Access System
            </p>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-600 space-y-2">
          <p>
            <strong>For verified medical professionals:</strong> Request full access through your authenticated device.
          </p>
          <p className="text-xs text-gray-500">
            Powered by BlockDAG blockchain • Encrypted with AES-256-GCM
          </p>
        </div>
      </div>
    </div>
  );
}

export default IceView;


