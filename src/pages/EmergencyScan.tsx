import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QRScanner } from '@/components/QRScanner';
import { IceView } from '@/components/IceView';
import { UserRoleSwitcher, DEMO_USERS, UserRole } from '@/components/UserRoleSwitcher';
import { 
  Scan, 
  AlertCircle, 
  Heart, 
  CheckCircle,
  Clock,
  Keyboard,
  ArrowLeft
} from "lucide-react";

import { API_URL } from '@/config/api';

export function EmergencyScan() {
  const [currentUser, setCurrentUser] = useState<UserRole>(DEMO_USERS[1]); // Default to Dr. Joe
  const [capsuleId, setCapsuleId] = useState('');
  const [loading, setLoading] = useState(false);
  const [accessData, setAccessData] = useState<any>(null);
  const [iceData, setIceData] = useState<any>(null);
  const [accessLevel, setAccessLevel] = useState<'full' | 'ice' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [burstKey, setBurstKey] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<'qr' | 'manual'>('qr');
  
  // Handle QR code scan
  const handleQRScan = async (decodedText: string) => {
    console.log('Scanned QR code:', decodedText);
    
    try {
      // Parse QR data
      const qrData = JSON.parse(decodedText);
      
      if (qrData.capsuleId) {
        await requestEmergencyAccess(qrData.capsuleId);
      } else {
        setError('Invalid QR code: no capsule ID found');
      }
    } catch (err) {
      console.error('QR parse error:', err);
      setError('Invalid QR code format');
    }
  };
  
  // Manual entry fallback
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
          medicId: currentUser.medicId || currentUser.id,
          medicPubKey: currentUser.publicKey || '0xDefaultPubKey',
          context: {
            location: 'Emergency Scene',
            deviceId: `${currentUser.role}_scanner`,
            attestation: 'emergency_responder'
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to request access');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Check if we got ICE view (non-verified user)
        if (data.accessLevel === 'ice') {
          console.log('🚨 [SCANNER] ICE view access granted');
          setAccessLevel('ice');
          setIceData(data.iceData);
          setLoading(false);
          return; // Don't try to get full data
        }
        
        // Verified medic - proceed with BurstKey
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
          medicId: currentUser.medicId || currentUser.id
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to access capsule');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAccessLevel('full');
        setAccessData(data.content);
      }
    } catch (err) {
      console.error('Capsule access failed:', err);
      setError('Failed to decrypt capsule data');
    }
  };
  
  // Show ICE view for non-verified users
  if (accessLevel === 'ice' && iceData) {
    return (
      <div>
        <Button 
          onClick={() => {
            setAccessLevel(null);
            setIceData(null);
            setAccessData(null);
            setBurstKey(null);
            setCapsuleId('');
            setError(null);
          }} 
          variant="ghost" 
          className="absolute top-4 left-4 z-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Scanner
        </Button>
        <IceView 
          iceData={iceData}
          message="You're viewing limited emergency information. Full medical data requires verified medical professional credentials."
        />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      {/* Floating User Switcher */}
      <div className="fixed top-4 right-4 z-50">
        <UserRoleSwitcher 
          currentUser={currentUser}
          onUserChange={(user) => {
            setCurrentUser(user);
            // Reset state on user change
            setAccessData(null);
            setBurstKey(null);
            setCapsuleId('');
            setError(null);
          }}
          compact={true}
        />
      </div>
      
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
          <Badge className="bg-blue-500 text-white">
            Scanning as: {currentUser.name}
          </Badge>
        </div>

        {/* Scanner / Manual Entry */}
        {!accessData && (
          <div className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                onClick={() => setScanMode('qr')}
                variant={scanMode === 'qr' ? 'default' : 'outline'}
                className="flex-1"
              >
                <Scan className="w-4 h-4 mr-2" />
                QR Scanner
              </Button>
              <Button
                onClick={() => setScanMode('manual')}
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                className="flex-1"
              >
                <Keyboard className="w-4 h-4 mr-2" />
                Manual Entry
              </Button>
            </div>

            {/* QR Scanner Mode */}
            {scanMode === 'qr' && !loading && (
              <QRScanner 
                onScan={handleQRScan}
                onError={(err) => setError(err)}
              />
            )}

            {/* Manual Entry Mode */}
            {scanMode === 'manual' && !loading && (
              <Card className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Capsule ID
                    </label>
                    <input
                      type="text"
                      value={capsuleId}
                      onChange={(e) => setCapsuleId(e.target.value)}
                      placeholder="Enter capsule ID (e.g., cap_1)"
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <Button
                    onClick={handleManualEntry}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Request Emergency Access
                  </Button>
                </div>
              </Card>
            )}

            {/* Loading State */}
            {loading && (
              <Card className="p-6">
                <div className="text-center space-y-3">
                  <Clock className="w-12 h-12 text-red-600 mx-auto animate-spin" />
                  <p className="font-semibold">Requesting Emergency Access...</p>
                  <p className="text-sm text-muted-foreground">
                    Issuing BurstKey and logging on BlockDAG
                  </p>
                </div>
              </Card>
            )}

            {/* Error Display */}
            {error && (
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </Card>
            )}
          </div>
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
                setIceData(null);
                setAccessLevel(null);
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

