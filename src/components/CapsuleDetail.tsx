import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Share2, 
  Clock, 
  User, 
  CheckCircle2,
  AlertCircle,
  Heart,
  Activity,
  Pill,
  Siren,
  Scale,
  Wallet,
  GraduationCap,
  Shield,
  Heart as HeartLegacy,
  QrCode,
  Download,
  LucideIcon
} from "lucide-react";
import { AuditTimeline } from "@/components/AuditTimeline";
import { BurstKeyStatusBadge, BurstKeyStatus } from "@/components/BurstKeyStatusBadge";
import { useAuth } from "@/contexts/AuthContext";

const capsuleConfig: Record<string, {
  title: string;
  icon: LucideIcon;
  gradient: string;
  description: string;
}> = {
  medical: {
    title: "Medical Capsule",
    icon: Heart,
    gradient: "medical-gradient",
    description: "Your health and medical information"
  },
  legal: {
    title: "Legal & Will",
    icon: Scale,
    gradient: "legal-gradient",
    description: "Your legal documents and will"
  },
  financial: {
    title: "Financial Capsule",
    icon: Wallet,
    gradient: "financial-gradient",
    description: "Your financial accounts and assets"
  },
  education: {
    title: "Education Capsule",
    icon: GraduationCap,
    gradient: "medical-gradient",
    description: "Your credentials and certifications"
  },
  safety: {
    title: "Safety & GBV",
    icon: Shield,
    gradient: "emergency-gradient",
    description: "Your safety information and resources"
  },
  legacy: {
    title: "Legacy Capsule",
    icon: HeartLegacy,
    gradient: "legal-gradient",
    description: "Your messages and memories for loved ones"
  }
};

interface CapsuleDetailProps {
  capsule: any; // Can be string (demo) or object (real capsule)
  onBack: () => void;
}

import { API_URL } from '@/config/api';

export const CapsuleDetail = ({ capsule, onBack }: CapsuleDetailProps) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [auditLog, setAuditLog] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [capsuleData, setCapsuleData] = useState<any>(null);
  
  // Determine if this is a real capsule object or demo type string
  const isRealCapsule = typeof capsule === 'object' && capsule.id;
  const capsuleType = isRealCapsule ? capsule.capsuleType : capsule;
  const config = capsuleConfig[capsuleType] || capsuleConfig.medical;
  const Icon = config.icon;

  // Fetch real capsule data if this is a real capsule
  useEffect(() => {
    console.log('🔍 [CAPSULE DETAIL] Effect triggered:', { isRealCapsule, capsuleId: capsule.id, capsule });
    
    if (isRealCapsule && capsule.id) {
      const fetchCapsuleData = async () => {
        console.log('📡 [CAPSULE DETAIL] Fetching capsule data for:', capsule.id);
        setLoading(true);
        try {
          const headers: HeadersInit = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const response = await fetch(`${API_URL}/api/capsules/${capsule.id}`, {
            headers
          });
          console.log('📡 [CAPSULE DETAIL] Response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📡 [CAPSULE DETAIL] Fetched data:', data);
            console.log('📡 [CAPSULE DETAIL] Capsule data structure:', JSON.stringify(data.capsule, null, 2));
            setCapsuleData(data.capsule);
          } else {
            console.error('📡 [CAPSULE DETAIL] Failed to fetch:', response.status, response.statusText);
          }
        } catch (error) {
          console.error('📡 [CAPSULE DETAIL] Error fetching capsule data:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCapsuleData();
    } else {
      console.log('📡 [CAPSULE DETAIL] Not fetching - not a real capsule or no ID');
    }
  }, [isRealCapsule, capsule.id]);

  // Use real capsule data if available, otherwise show loading or empty state
  const medicalData = capsuleData?.content || capsuleData;
  
  // Debug logging
  console.log('🔍 [CAPSULE DETAIL] medicalData:', medicalData);
  console.log('🔍 [CAPSULE DETAIL] medicalData?.metadata:', medicalData?.metadata);
  console.log('🔍 [CAPSULE DETAIL] capsuleData?.content:', capsuleData?.content);

  // Ensure emergencyContact exists and has required properties
  const safeEmergencyContact = medicalData?.emergencyContact || {
    name: "Emergency Contact",
    phone: "Not provided",
    relation: "Unknown"
  };

  // Note: Permissions would come from BurstKeys in production
  const permissions = [
    { name: "Dr. Sarah Johnson", access: "Full Access", expires: "30 days", status: "active" as BurstKeyStatus },
    { name: "City General Hospital", access: "Emergency Only", expires: "Never", status: "active" as BurstKeyStatus },
    { name: "John Doe (Family)", access: "View Only", expires: "90 days", status: "active" as BurstKeyStatus }
  ];

  // Fetch audit log from blockchain
  useEffect(() => {
    const fetchAuditLog = async () => {
      if (activeTab === "history") {
        console.log('📡 [AUDIT] Fetching audit log for capsule:', isRealCapsule ? capsule.id : "cap_1");
        setLoading(true);
        try {
          const capsuleId = isRealCapsule ? capsule.id : "cap_1";
          const response = await fetch(`${API_URL}/api/capsules/${capsuleId}/audit`);
          console.log('📡 [AUDIT] Response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📡 [AUDIT] Fetched audit data:', data);
            setAuditLog(data.accessLog || []);
          } else {
            console.error('📡 [AUDIT] Failed to fetch audit log:', response.status);
          }
        } catch (error) {
          console.error('📡 [AUDIT] Error fetching audit log:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchAuditLog();
  }, [activeTab, isRealCapsule, capsule.id]);

  // Fetch QR code - ONLY for real capsules
  useEffect(() => {
    const fetchQRCode = async () => {
      if (activeTab === "qrcode" && !qrCodeData && isRealCapsule && capsule.id) {
        console.log('📡 [QR] Fetching QR code for REAL capsule:', capsule.id);
        setQrLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/capsules/${capsule.id}/qrcode`);
          console.log('📡 [QR] Response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('📡 [QR] Fetched QR data:', data);
            setQrCodeData(data.qrCode);
          } else {
            console.error('📡 [QR] Failed to fetch QR code:', response.status);
            const errorText = await response.text();
            console.error('📡 [QR] Error response:', errorText);
          }
        } catch (error) {
          console.error('📡 [QR] Error fetching QR code:', error);
        } finally {
          setQrLoading(false);
        }
      } else if (activeTab === "qrcode" && !isRealCapsule) {
        console.log('📡 [QR] Not a real capsule - showing demo message');
        setQrCodeData(null);
      }
    };
    fetchQRCode();
  }, [activeTab, qrCodeData, isRealCapsule, capsule.id]);

  const history = auditLog.length > 0 ? auditLog.map(event => ({
    date: new Date(event.timestamp).toLocaleString(),
    action: `${event.event} by ${event.accessorId}`,
    type: event.event === "BurstKeyIssued" ? "grant" : "view"
  })) : [
    { date: "No access history yet", action: "Waiting for first access...", type: "view" }
  ];

  return (
    <div className="min-h-screen p-6 animate-fade-in">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon"
            onClick={onBack}
            className="hover:bg-muted transition-smooth"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className={`${config.gradient} p-3 rounded-2xl text-white`}>
                <Icon className="w-6 h-6" />
              </div>
              <h1 className="font-heading font-bold text-3xl">{config.title}</h1>
            </div>
            <p className="text-muted-foreground">{config.description}</p>
          </div>

          <Button className={`${config.gradient} text-white hover:opacity-90 transition-smooth`}>
            <Share2 className="w-4 h-4 mr-2" />
            Grant Access
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="qrcode">QR Code</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Clock className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2">Loading capsule data...</span>
              </div>
            ) : !medicalData ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No capsule data available</p>
              </div>
            ) : (
              <>
                {/* Emergency Info */}
                <Card className="p-6 border-2 border-accent/20 bg-accent/5">
              <div className="flex items-start gap-4">
                <div className="emergency-gradient p-3 rounded-xl text-white">
                  <Siren className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-semibold text-lg mb-2">Emergency Information</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This information is accessible to emergency responders via QR code
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Blood Type</div>
                      <div className="font-semibold text-lg text-accent">{medicalData?.bloodType || "Not provided"}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Emergency Contact</div>
                      <div className="font-semibold">{safeEmergencyContact.name}</div>
                      <div className="text-sm text-muted-foreground">{safeEmergencyContact.phone}</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Health Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Allergies */}
              <Card className="p-6 card-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg">Allergies</h3>
                </div>
                <div className="space-y-2">
                  {(medicalData?.allergies || []).length > 0 ? (
                    (medicalData.allergies || []).map((allergy, index) => (
                      <Badge key={index} variant="destructive" className="mr-2">
                        {allergy}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No allergies recorded</p>
                  )}
                </div>
              </Card>

              {/* Medications */}
              <Card className="p-6 card-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Pill className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg">Current Medications</h3>
                </div>
                <div className="space-y-2">
                  {(medicalData?.medications || []).length > 0 ? (
                    (medicalData.medications || []).map((med, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm">{med}</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No medications recorded</p>
                  )}
                </div>
              </Card>

              {/* Conditions */}
              <Card className="p-6 card-shadow md:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg">Medical Conditions</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(medicalData?.conditions || []).length > 0 ? (
                    (medicalData.conditions || []).map((condition, index) => (
                      <Badge key={index} variant="secondary">
                        {condition}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No medical conditions recorded</p>
                  )}
                </div>
              </Card>
            </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="qrcode" className="space-y-4">
            <Card className="p-8">
              <div className="text-center space-y-6">
                <div>
                  <div className="inline-flex p-4 bg-accent/10 rounded-2xl mb-4">
                    <QrCode className="w-12 h-12 text-accent" />
                  </div>
                  <h3 className="font-heading font-semibold text-2xl mb-2">Emergency Access QR Code</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Scan this QR code to provide emergency responders instant access to critical medical information
                  </p>
                </div>

                {qrLoading ? (
                  <div className="flex justify-center py-8">
                    <Clock className="w-12 h-12 text-primary animate-spin" />
                    <span className="ml-2">Generating QR code...</span>
                  </div>
                ) : !isRealCapsule ? (
                  <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-yellow-800 text-center">
                      <strong>Demo Mode:</strong> This is a demo capsule. Create a real capsule to generate a QR code for emergency access.
                    </p>
                  </div>
                ) : qrCodeData ? (
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <div className="p-4 bg-white rounded-xl border-4 border-accent/20 shadow-lg">
                        <img 
                          src={qrCodeData} 
                          alt="Emergency Access QR Code" 
                          className="w-64 h-64"
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-center gap-3">
                      <Button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = qrCodeData;
                          link.download = `everguard-qr-${capsuleType}.png`;
                          link.click();
                        }}
                        className="bg-accent hover:bg-accent/90 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </Button>
                      
                      <Button
                        onClick={() => window.print()}
                        variant="outline"
                      >
                        Print QR Code
                      </Button>
                    </div>

                    <Card className="p-4 bg-blue-50 border-blue-200 text-left max-w-md mx-auto">
                      <p className="text-sm text-blue-900">
                        💡 <strong>Tip:</strong> Print this QR code and keep it in your wallet, attach it to your phone case, or save it to your emergency contacts.
                      </p>
                    </Card>
                  </div>
                ) : (
                  <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600">Failed to generate QR code</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <p className="text-muted-foreground mb-4">
              Manage who can access your medical capsule and for how long
            </p>
            {permissions.map((permission, index) => (
              <Card key={index} className="p-6 hover:border-primary/50 transition-smooth">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{permission.name}</h4>
                      <p className="text-sm text-muted-foreground">{permission.access}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Clock className="w-4 h-4" />
                        Expires: {permission.expires}
                      </div>
                      <BurstKeyStatusBadge 
                        status={permission.status as BurstKeyStatus}
                        showTooltip={true}
                      />
                    </div>
                    <Button variant="outline" size="sm">
                      Revoke
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <Clock className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <AuditTimeline events={auditLog} />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
