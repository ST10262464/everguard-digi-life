import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Scan, 
  AlertCircle, 
  Heart, 
  CheckCircle,
  Clock
} from "lucide-react";

const API_URL = "http://localhost:5001";

export function EmergencyScan() {
  const [capsuleId, setCapsuleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessData, setAccessData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState<string | null>(null);
  
  // For demo: manually enter capsule ID instead of QR scanning
  const handleManualEntry = async () => {
    if (!capsuleId.trim()) {
      setError('Please enter a capsule ID');
      return;
    }
    
    await requestEmergencyAccess(capsuleId.trim());
  };
  
  const requestEmergencyAccess = async (capsuleIdToAccess: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Step 1: Request BurstKey
      const response = await fetch(`${API_URL}/api/emergency/request-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          capsuleId: capsuleIdToAccess,
          medicId: 'medic_emergency',
          medicPubKey: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
          context: {
            location: 'Emergency Scene',
            deviceId: 'ems_device_001',
            attestation: 'emergency_responder'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to request access');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setBurstKey(data.burstKey);
        // Step 2: Use BurstKey to access capsule
        await accessCapsule(data.burstKey);
      }
    } catch (err) {
      console.error('Access request failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to access capsule');
    } finally {
      setLoading(false);
    }
  };
  
  const accessCapsule = async (key: string) => {
    try {
      const response = await fetch(`${API_URL}/api/emergency/access-capsule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          burstKey: key, 
          medicId: 'medic_emergency' 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to access capsule');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAccessData(data.content);
      }
    } catch (err) {
      console.error('Capsule access failed:', err);
      setError('Failed to decrypt capsule data');
    }
  };
  
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-red-100 rounded-full">
              <Scan className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h1 className="font-heading font-bold text-3xl">Emergency Scanner</h1>
          <p className="text-muted-foreground">Access critical medical information</p>
        </div>

        {/* Scanner / Manual Entry */}
        {!accessData && (
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Capsule ID (For Demo)
                </label>
                <input
                  type="text"
                  value={capsuleId}
                  onChange={(e) => setCapsuleId(e.target.value)}
                  placeholder="Enter capsule ID (e.g., cap_1)"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  disabled={loading}
                />
              </div>
              
              <Button
                onClick={handleManualEntry}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 text-white"
              >
                {loading ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Requesting Access...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Request Emergency Access
                  </>
                )}
              </Button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  In production, this would use QR code scanning or NFC
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Emergency Data Display */}
        {accessData && (
          <div className="space-y-4 animate-fade-in">
            {/* Success Banner */}
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <div>
                  <p className="font-semibold text-green-900">Access Granted</p>
                  <p className="text-sm text-green-700">Emergency medical data decrypted</p>
                </div>
              </div>
            </Card>

            {/* Blood Type */}
            <Card className="p-6 bg-white">
              <div className="flex items-center gap-4">
                <div className="medical-gradient p-4 rounded-2xl text-white">
                  <Heart className="w-8 h-8" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Blood Type</div>
                  <div className="text-4xl font-bold text-red-600">
                    {accessData.bloodType || 'Unknown'}
                  </div>
                </div>
              </div>
            </Card>

            {/* Allergies */}
            {accessData.allergies && accessData.allergies.length > 0 && (
              <Card className="p-6 bg-white">
                <div className="flex items-center gap-3 mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                  <h3 className="font-heading font-semibold text-lg">Critical Allergies</h3>
                </div>
                <div className="space-y-2">
                  {accessData.allergies.map((allergy: string, index: number) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg border-2 border-red-200">
                      <span className="font-semibold text-red-900">{allergy}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Medications */}
            {accessData.medications && accessData.medications.length > 0 && (
              <Card className="p-6 bg-white">
                <h4 className="font-heading font-semibold text-lg mb-4">Current Medications</h4>
                <div className="space-y-2">
                  {accessData.medications.map((med: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{med}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Emergency Contact */}
            {accessData.emergencyContact && (
              <Card className="p-6 bg-white">
                <h4 className="font-heading font-semibold text-lg mb-4">Emergency Contact</h4>
                <div>
                  <p className="font-semibold text-lg">{accessData.emergencyContact.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {accessData.emergencyContact.phone}
                  </p>
                </div>
              </Card>
            )}

            {/* Conditions */}
            {accessData.conditions && accessData.conditions.length > 0 && (
              <Card className="p-6 bg-white">
                <h4 className="font-heading font-semibold text-lg mb-4">Medical Conditions</h4>
                <div className="flex flex-wrap gap-2">
                  {accessData.conditions.map((condition: string, index: number) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Footer */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-xs text-blue-900">
                ✅ Access logged on BlockDAG • Single-use key consumed • Audit trail updated
              </p>
            </Card>

            <Button
              onClick={() => {
                setAccessData(null);
                setBurstKey(null);
                setCapsuleId('');
                setError(null);
              }}
              variant="outline"
              className="w-full"
            >
              Scan Another Capsule
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

