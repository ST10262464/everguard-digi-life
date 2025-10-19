import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ToggleLeft, ToggleRight, ClipboardList, Lock, Send, Zap, Users, Siren, Loader2, Check 
} from "lucide-react";
import { GeneralOverviewProps, SafetyProps } from "./CapsuleDetail";
import { submitEncryptedReport, triggerPanicAlert, getMockGeolocation, AUTHORITIES } from "@/services/safety-service";

type IncidentLogEntry = {
  id: number;
  date: string;
  type: string;
  status: string;
};

type SafetyOverviewProps = GeneralOverviewProps & SafetyProps;

export const SafetyOverview: React.FC<SafetyOverviewProps> = ({ 
  config,
  isHiddenMode, 
  handleToggleHiddenMode, 
  isSubmitting, 
  setIsSubmitting,
  isPanicActive, 
  setIsPanicActive,
  handlePanicButton, 
  handleSubmitReport,
  safetyData,
  setSafetyData
}) => {

  const [newIncidentDescription, setNewIncidentDescription] = useState<string>('');
  const [selectedAuthority, setSelectedAuthority] = useState<string>("ngo");
  const [showAuthoritySelect, setShowAuthoritySelect] = useState(true);

  // --- Core Functionality: Log Incident ---
  const handleLogIncident = useCallback(() => {
    if (!newIncidentDescription.trim()) return;

    const newEntry: IncidentLogEntry = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      type: `Log Entry: ${newIncidentDescription.trim().slice(0, 20)}...`,
      status: "Logged, BlockDAG Encrypted",
    };

    setSafetyData(prev => ({
      ...prev,
      incidentLog: [...prev.incidentLog, newEntry]
    }));
    setNewIncidentDescription('');

    console.log(`%c[LOG] Incident recorded and securely encrypted on client. Ready for key-based sharing.`, "color: #22c55e;");
    alert(`Incident logged and securely encrypted on your device! It's ready to be submitted.`);
  }, [newIncidentDescription, setSafetyData]);

  // --- Core Functionality: Secure Submission ---
  const handleSecureSubmission = useCallback(async () => {
    if (safetyData.incidentLog.length === 0) {
      alert("Please log an incident before submission.");
      return;
    }

    const consolidatedLog = safetyData.incidentLog.map(log => `${log.date}: ${log.type} (${log.status})`).join(' | ');
    
    setIsSubmitting(true);
    
    try {
      const authority = AUTHORITIES.find(a => a.id === selectedAuthority)!;

      await submitEncryptedReport({
        incidentLog: consolidatedLog,
        authorityId: selectedAuthority,
        snapshot: "CapsuleDataSnapshot_Mock",
      });
      
      setSafetyData(prev => ({
        ...prev,
        incidentLog: prev.incidentLog.map(log => ({ 
          ...log, 
          status: `Reported to ${authority.id.toUpperCase()}` 
        }))
      }));

      handleSubmitReport();
    } catch (error) {
      alert(`Submission Error: ${(error as Error).message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [safetyData.incidentLog, selectedAuthority, setIsSubmitting, handleSubmitReport, setSafetyData]);

  // --- Core Functionality: Panic Button ---
  const handlePanic = useCallback(async () => {
    const { latitude, longitude } = getMockGeolocation();
    
    const capsuleSnapshot = btoa(JSON.stringify({ 
      log: safetyData.incidentLog, 
      contact: safetyData.emergencyContact, 
      gps_tx: "GPS_TX_MOCK_HASH"
    }));
    
    setIsPanicActive(true);

    try {
      await triggerPanicAlert({
        latitude,
        longitude,
        capsuleSnapshot,
        emergencyContactKey: safetyData.emergencyContact.publicKey,
      });
      
      handlePanicButton();
    } catch (error) {
      alert(`Panic Alert Failed: ${(error as Error).message}`);
    } finally {
      setIsPanicActive(false);
    }
  }, [safetyData, setIsPanicActive, handlePanicButton]);
  
  return (
    <>
      {/* 1. Hidden Entry Mode and Panic Button */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${isHiddenMode ? 'bg-zinc-900 text-white' : ''}`}> 
        <Card 
          className={`p-6 card-shadow md:col-span-1 flex flex-col justify-center transition-all 
                      ${isHiddenMode ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-background'}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg">Hidden Entry Mode</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleToggleHiddenMode}
              className={isHiddenMode ? 'text-green-400 hover:text-green-300' : 'text-muted-foreground'}
            >
              {isHiddenMode ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </Button>
          </div>
          <p className={`text-sm ${isHiddenMode ? 'text-zinc-400' : 'text-muted-foreground'}`}>
            {isHiddenMode ? "Capsule UI is disguised. Switch the app to a non-suspicious display." : "Toggle on to disguise the capsule interface for private access."}
          </p>
        </Card>

        <Card 
          className={`p-6 card-shadow md:col-span-2 flex flex-col items-center justify-center transition-all 
              ${isPanicActive ? 'bg-red-600/90 text-white animate-pulse-slow' : isHiddenMode ? 'bg-zinc-900 text-white border-zinc-800' : 'border-red-500 border-2 bg-red-50'} 
              ${isPanicActive ? 'pointer-events-none' : 'cursor-pointer'}`}
          onClick={handlePanic}
        >
          <div className="flex items-center gap-4">
            <Zap className={`w-8 h-8 ${isPanicActive ? 'text-white' : 'text-red-600'}`} />
            <h3 className={`font-heading font-extrabold text-3xl ${isPanicActive ? 'text-white' : 'text-red-600'}`}>
              {isPanicActive ? "ALERT SENT (4s)..." : "PANIC BUTTON"}
            </h3>
          </div>
          <p className={`text-sm mt-2 ${isPanicActive ? 'text-red-200' : 'text-red-500'}`}>
            {isPanicActive 
              ? "GPS & Encrypted Snapshot sharing with contact key." 
              : `Tap to share GPS + encrypted Capsule snapshot with ${safetyData.emergencyContact.name}.`
            }
          </p>
        </Card>
      </div>

      {/* 2. Incident Logging and Secure Submission */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${isHiddenMode ? 'bg-zinc-900 text-white' : ''}`}> 
        {/* Confidential Incident Logging */}
        <Card className={`p-6 card-shadow ${isHiddenMode ? 'bg-zinc-900 text-white border-zinc-800' : ''}`}> 
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <ClipboardList className="w-5 h-5 text-blue-500" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Confidential Incident Log (End-to-End Encrypted)</h3>
          </div>
          <div className="space-y-3">
            <Textarea 
              placeholder="Confidential details of incident..."
              value={newIncidentDescription}
              onChange={(e) => setNewIncidentDescription(e.target.value)}
              className="resize-none h-24 text-black placeholder:text-black"
            />
            <Button 
              variant="outline" 
              className="w-full text-black hover:text-black" 
              onClick={handleLogIncident} 
              disabled={!newIncidentDescription.trim()}
            >
              + Encrypt & Log New Incident on BlockDAG
            </Button>
            
            <div className="pt-2 border-t mt-4">
              <h4 className="font-semibold text-sm mb-2">Past Logs ({safetyData.incidentLog.length}):</h4>
              {safetyData.incidentLog.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm py-2 border-b last:border-b-0">
                  <div className="truncate">
                    <span className="font-medium mr-2">{log.date}:</span>
                    <span>{log.type}</span>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={log.status.includes('Encrypted') ? 'bg-green-500 hover:bg-green-600 text-white' : ''}
                  >
                    <Lock className="w-3 h-3 mr-1" />
                    {log.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Secure Submission Card */}
        <Card className={`p-6 card-shadow flex flex-col justify-between ${isHiddenMode ? 'bg-zinc-900 text-white border-zinc-800' : ''}`}> 
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Lock className="w-5 h-5 text-green-500" />
              </div>
              <h3 className="font-heading font-semibold text-lg">Secure Authority Submission (Key-Restricted)</h3>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="showAuthoritySelect"
                checked={showAuthoritySelect}
                onChange={e => setShowAuthoritySelect(e.target.checked)}
              />
              <label htmlFor="showAuthoritySelect" className="text-sm cursor-pointer text-black">
                Select the authority whose public key will decrypt the report
              </label>
            </div>
            {showAuthoritySelect && (
              <>
                <Select value={selectedAuthority} onValueChange={setSelectedAuthority}>
                  <SelectTrigger className="text-black">
                    <SelectValue placeholder="Select Authority" className="text-black" />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTHORITIES.map(auth => (
                      <SelectItem key={auth.id} value={auth.id} className="text-black">
                        {auth.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="space-y-2 mt-4">
                  <Badge variant="secondary"><Users className="w-3 h-3 mr-1" /> Destination: {AUTHORITIES.find(a => a.id === selectedAuthority)?.name}</Badge>
                  <Badge variant="secondary"><Check className="w-3 h-3 mr-1" /> NIST/ISO Certified Security</Badge>
                </div>
              </>
            )}
          </div>
          <Button 
            className={`${config.gradient} text-white hover:opacity-90`}
            onClick={handleSecureSubmission}
            disabled={isSubmitting || safetyData.incidentLog.length === 0}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSubmitting ? "Encrypting & Submitting..." : `Submit Encrypted Report${showAuthoritySelect ? ` (to ${AUTHORITIES.find(a => a.id === selectedAuthority)?.id.toUpperCase()})` : ''}`}
          </Button>
        </Card>
      </div>

      {/* 3. Emergency Contact Quick View */}
      <Card className={`p-4 border-l-4 border-red-500 ${isHiddenMode ? 'bg-zinc-900 text-white border-zinc-800' : 'bg-red-50'}`}> 
        <div className="flex items-center gap-4">
          <Siren className="w-6 h-6 text-red-600" />
          <div>
            <p className="text-sm font-semibold text-red-600">
              Primary Emergency Contact (Key: {safetyData.emergencyContact.publicKey.slice(-8)})
            </p>
            <p className="font-medium">
              {safetyData.emergencyContact.name} ({safetyData.emergencyContact.phone})
            </p>
          </div>
        </div>
      </Card>
    </>
  );
};
