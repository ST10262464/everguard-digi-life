import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IceView } from "./IceView";
import { 
  ArrowLeft, 
  AlertCircle, 
  Heart, 
  Phone,
  Clock,
  Shield
} from "lucide-react";

interface UserRole {
  id: string;
  name: string;
  role: 'patient' | 'verified_medic' | 'non_verified' | 'hacker';
  medicId?: string;
  publicKey?: string;
  description: string;
}

interface EmergencyAccessProps {
  onBack: () => void;
  capsuleId?: string;
  currentUser: UserRole;
}

interface EmergencyData {
  bloodType: string;
  allergies: string[];
  medications: string[];
  emergencyContact: {
    name: string;
    phone: string;
  };
  conditions: string[];
}

import { API_URL } from '@/config/api';

export const EmergencyAccess = ({ onBack, capsuleId = "cap_1", currentUser }: EmergencyAccessProps) => {
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds
  const [emergencyData, setEmergencyData] = useState<EmergencyData | null>(null);
  const [iceData, setIceData] = useState<any>(null);
  const [accessLevel, setAccessLevel] = useState<'full' | 'ice' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch emergency data from API
  useEffect(() => {
    const fetchEmergencyData = async () => {
      try {
        setLoading(true);
        // Step 1: Request BurstKey
        const accessResponse = await fetch(`${API_URL}/api/emergency/request-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            capsuleId: capsuleId,
            medicId: currentUser.medicId || currentUser.id,
            medicPubKey: currentUser.publicKey || "0xDefaultPubKey",
            context: {
              location: "Emergency Room",
              deviceId: `${currentUser.role}_device`,
              attestation: "emergency"
            }
          })
        });

        if (!accessResponse.ok) throw new Error('Failed to request access');
        const accessData = await accessResponse.json();

        // Check if we got ICE view instead of BurstKey (non-verified user)
        if (accessData.accessLevel === 'ice') {
          console.log('🚨 [FRONTEND] ICE view access granted for non-verified user');
          setAccessLevel('ice');
          setIceData(accessData.iceData);
          return; // Don't try to get full data
        }

        // Check if we got a BurstKey
        if (!accessData.burstKey) {
          throw new Error('No BurstKey received. The user may not be verified or an active key already exists.');
        }

        // Step 2: Use BurstKey to get capsule data (verified medic only)
        const capsuleResponse = await fetch(`${API_URL}/api/emergency/access-capsule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            burstKey: accessData.burstKey,
            medicId: currentUser.medicId || currentUser.id
          })
        });

        if (!capsuleResponse.ok) {
          const errorData = await capsuleResponse.json().catch(() => ({ error: 'Failed to access capsule' }));
          throw new Error(errorData.error || 'Failed to access capsule');
        }
        
        const capsuleData = await capsuleResponse.json();

        if (!capsuleData.success || !capsuleData.content) {
          throw new Error('No medical data received from capsule');
        }

        setAccessLevel('full');
        setEmergencyData(capsuleData.content);
      } catch (err) {
        console.error('Error fetching emergency data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load emergency data');
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencyData();
  }, [capsuleId, currentUser]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (loading) {
    return (
      <div className="min-h-screen p-6 emergency-gradient flex items-center justify-center">
        <Card className="p-8 bg-white/95 backdrop-blur-sm border-0">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading emergency data...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Show ICE view for non-verified users
  if (accessLevel === 'ice' && iceData) {
    return (
      <div>
        <Button 
          onClick={onBack} 
          variant="ghost" 
          className="absolute top-4 left-4 z-50"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <IceView 
          iceData={iceData}
          message="You're viewing limited emergency information. Full medical data requires verified medical professional credentials."
        />
      </div>
    );
  }

  if (error || !emergencyData) {
    return (
      <div className="min-h-screen p-6 emergency-gradient flex items-center justify-center">
        <Card className="p-8 bg-white/95 backdrop-blur-sm border-0">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold mb-2">Unable to Access Emergency Data</p>
            <p className="text-muted-foreground mb-4">{error || 'No data available'}</p>
            <Button onClick={onBack}>Go Back</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 emergency-gradient">
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="icon"
            onClick={onBack}
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <div className="flex gap-3 items-center">
            <Badge className="bg-blue-500/80 text-white border-blue-400 px-3 py-1">
              {currentUser.name}
            </Badge>
            <Badge className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
              <Clock className="w-5 h-5 mr-2" />
              {minutes}:{seconds.toString().padStart(2, '0')}
            </Badge>
          </div>
        </div>

        {/* Alert Banner */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm border-0">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/10 rounded-xl">
              <AlertCircle className="w-8 h-8 text-accent" />
            </div>
            <div className="flex-1">
              <h2 className="font-heading font-bold text-2xl mb-2">Emergency Access Granted</h2>
              <p className="text-muted-foreground">
                Limited medical information is now visible. Access will automatically expire in {minutes} minutes.
              </p>
            </div>
          </div>
        </Card>

        {/* Critical Information */}
        <div className="space-y-4">
          <h3 className="font-heading font-semibold text-white text-xl flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Critical Medical Information
          </h3>

          {/* Blood Type */}
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0">
            <div className="flex items-center gap-4">
              <div className="medical-gradient p-4 rounded-2xl text-white">
                <Heart className="w-8 h-8" />
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Blood Type</div>
                <div className="text-4xl font-bold text-accent">{emergencyData.bloodType}</div>
              </div>
            </div>
          </Card>

          {/* Allergies */}
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-accent" />
              <h4 className="font-heading font-semibold text-lg">Known Allergies</h4>
            </div>
            <div className="space-y-2">
              {emergencyData.allergies.map((allergy, index) => (
                <div key={index} className="p-3 bg-accent/10 rounded-lg border-2 border-accent/20">
                  <span className="font-semibold text-accent">{allergy}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Current Medications */}
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0">
            <h4 className="font-heading font-semibold text-lg mb-4">Current Medications</h4>
            <div className="space-y-2">
              {emergencyData.medications.map((med, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-sm">{med}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Emergency Contact */}
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0">
            <h4 className="font-heading font-semibold text-lg mb-4">Emergency Contact</h4>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-lg">{emergencyData.emergencyContact.name}</p>
                <p className="text-sm text-muted-foreground">Emergency Contact</p>
              </div>
              <Button className="medical-gradient text-white">
                <Phone className="w-4 h-4 mr-2" />
                Call Now
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{emergencyData.emergencyContact.phone}</p>
          </Card>

          {/* Medical Conditions */}
          <Card className="p-6 bg-white/95 backdrop-blur-sm border-0">
            <h4 className="font-heading font-semibold text-lg mb-4">Medical Conditions</h4>
            <div className="flex flex-wrap gap-2">
              {emergencyData.conditions.map((condition, index) => (
                <Badge key={index} variant="secondary" className="px-3 py-1">
                  {condition}
                </Badge>
              ))}
            </div>
          </Card>
        </div>

        {/* Footer */}
        <Card className="p-6 bg-white/95 backdrop-blur-sm border-0">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Shield className="w-5 h-5 text-primary" />
            <p>
              This access is logged and will be visible to the data owner. 
              All information is encrypted and secured via BlockDAG.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
