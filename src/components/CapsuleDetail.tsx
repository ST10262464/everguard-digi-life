import React, { useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Share2, LucideIcon, Heart, Scale, Wallet, GraduationCap, Shield, Heart as HeartLegacy,
  Clock, User, CheckCircle2, Activity, Pill, Siren, AlertCircle
} from "lucide-react"; 
import { MOCK_OWNER_PUBLIC_KEY } from "@/utils/crypto";

// Import the dedicated Overview components
import { EducationOverview } from "./EducationOverview";
import { SafetyOverview } from "./SafetyOverview";

// --- Type Definitions (Exported for child components) ---
interface CapsuleConfigItem {
  title: string;
  icon: LucideIcon;
  gradient: string;
  description: string;
}

export interface CapsuleDetailProps {
  capsuleType: string;
  onBack: () => void;
}

// Data State Definitions
const educationInitialState = {
    credentials: [
        { name: "MSc Computer Science", institution: "Tech University", date: "2018", verified: true },
        { name: "BSc Software Engineering", institution: "State College", date: "2016", verified: true },
        { name: "Certified Scrum Master", institution: "Scrum Alliance", date: "2020", verified: false },
    ],
    aiSummary: `Initial summary generated based on baseline data. Owner ID: ${MOCK_OWNER_PUBLIC_KEY.slice(-8)}`,
    verificationToken: null as string | null,
};

const safetyInitialState = {
    incidentLog: [
        { id: 1, date: "Oct 15, 2025", type: "Verbal Harassment", status: "Logged, BlockDAG Encrypted" },
        { id: 2, date: "Sept 01, 2025", type: "Online Abuse", status: "Reported to NGO" },
    ],
    emergencyContact: { name: "Guardian Angel", phone: "+1 (555) 987-6543", publicKey: "CONTACT-0xZ1Y2X3W4V5U6" },
};

// Interfaces for states/logic passed to children - Updated with data states
export interface EducationProps {
  isEduVerifying: boolean;
  setIsEduVerifying: React.Dispatch<React.SetStateAction<boolean>>;
  isEduVerified: boolean;
  setIsEduVerified: React.Dispatch<React.SetStateAction<boolean>>;
  handleInstantVerify: () => void;
  VerifiedSeal: React.FC;
  eduData: typeof educationInitialState;
  setEduData: React.Dispatch<React.SetStateAction<typeof educationInitialState>>;
}

export interface SafetyProps {
  isHiddenMode: boolean;
  setIsHiddenMode: React.Dispatch<React.SetStateAction<boolean>>;
  isSubmitting: boolean;
  setIsSubmitting: React.Dispatch<React.SetStateAction<boolean>>;
  isPanicActive: boolean;
  setIsPanicActive: React.Dispatch<React.SetStateAction<boolean>>;
  handleToggleHiddenMode: () => void;
  handleSubmitReport: () => void;
  handlePanicButton: () => void;
  safetyData: typeof safetyInitialState;
  setSafetyData: React.Dispatch<React.SetStateAction<typeof safetyInitialState>>;
}

// General prop interface for all overview components
export interface GeneralOverviewProps extends Partial<EducationProps>, Partial<SafetyProps> {
  config: CapsuleConfigItem;
  capsuleType: string;
}

// --- Other Mock Data ---
const medicalData = {
    bloodType: "O+",
    allergies: ["Penicillin", "Peanuts"],
    medications: ["Lisinopril 10mg", "Metformin 500mg"],
    emergencyContact: {
      name: "Jane Doe",
      phone: "+1 (555) 123-4567",
      relation: "Spouse"
    },
    conditions: ["Type 2 Diabetes", "Hypertension"]
};
const permissions = [
    { name: "Dr. Sarah Johnson", access: "Full Access", expires: "30 days", status: "active" },
    { name: "City General Hospital", access: "Emergency Only", expires: "Never", status: "active" },
    { name: "John Doe (Family)", access: "View Only", expires: "90 days", status: "pending" }
];
const history = [
    { date: "2 hours ago", action: "Accessed by Dr. Sarah Johnson", type: "view" },
    { date: "1 day ago", action: "Updated medications list", type: "edit" },
    { date: "3 days ago", action: "Emergency access granted to City Hospital", type: "grant" },
    { date: "1 week ago", action: "Added new allergy information", type: "edit" }
];


// --- Capsule Configuration (Master) ---
const capsuleConfig: Record<string, CapsuleConfigItem> = {
    medical: { title: "Medical Capsule", icon: Heart, gradient: "medical-gradient", description: "Your health and medical information" },
    legal: { title: "Legal & Will", icon: Scale, gradient: "legal-gradient", description: "Your legal documents and will" },
    financial: { title: "Financial Capsule", icon: Wallet, gradient: "financial-gradient", description: "Your financial accounts and assets" },
    education: { title: "Education & Career Capsule", icon: GraduationCap, gradient: "education-gradient", description: "Your credentials, diplomas, and transcripts" },
    safety: { title: "GBV & Safety Capsule", icon: Shield, gradient: "emergency-gradient", description: "Confidential logging and emergency support for safety" },
    legacy: { title: "Legacy Capsule", icon: HeartLegacy, gradient: "legal-gradient", description: "Your messages and memories for loved ones" }
};


export const CapsuleDetail: React.FC<CapsuleDetailProps> = ({ capsuleType, onBack }) => {
    const [activeTab, setActiveTab] = useState("overview");

    // --- Education States & Logic ---
    const [isEduVerifying, setIsEduVerifying] = useState(false);
    const [isEduVerified, setIsEduVerified] = useState(false);
    const [eduData, setEduData] = useState(educationInitialState);
    
    const handleInstantVerify = useCallback(() => {
        if (isEduVerifying) return;
        setIsEduVerifying(true);
        setIsEduVerified(false);
        setTimeout(() => {
            setIsEduVerifying(false);
            setIsEduVerified(true);
        }, 3000);
    }, [isEduVerifying]);

    const VerifiedSeal: React.FC = () => (
        <div 
            className={`absolute inset-0 flex items-center justify-center pointer-events-none z-50 transition-all ${
                isEduVerified ? 'opacity-100' : 'opacity-0'
            }`}
        >
            <div 
                className="w-36 h-36 rounded-full bg-green-500/80 backdrop-blur-sm shadow-2xl flex flex-col items-center justify-center text-white p-4 verified-seal-animation"
                style={{ animation: isEduVerified ? 'stamp-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' : 'none' }}
            >
                <CheckCircle2 className="w-12 h-12 mb-1" />
                <span className="font-bold text-lg">VERIFIED</span>
                <span className="text-xs">ON BLOCKDAG</span>
            </div>
        </div>
    );
    
    // --- Safety/GBV States & Logic ---
    const [isHiddenMode, setIsHiddenMode] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isPanicActive, setIsPanicActive] = useState(false);
    const [safetyData, setSafetyData] = useState(safetyInitialState);
    
    const handleToggleHiddenMode = () => setIsHiddenMode(prev => !prev);

    const handleSubmitReport = useCallback(() => {
        // Mocked success logic after service call finishes
        alert("Encrypted report submitted successfully to secure authority node!");
    }, []);

    const handlePanicButton = useCallback(() => {
        // Mocked success logic after service call finishes
        alert(`Emergency alert sent to ${safetyData.emergencyContact.name} with GPS location!`);
    }, [safetyData.emergencyContact.name]);

    // --- Configuration and Renderer Selection ---
    const config = capsuleConfig[capsuleType] || capsuleConfig.medical;
    const Icon = config.icon;

    const isEducationCapsule = capsuleType === 'education';
    const isSafetyCapsule = capsuleType === 'safety';

    const OverviewComponent = useMemo(() => {
        if (isEducationCapsule) return EducationOverview;
        if (isSafetyCapsule) return SafetyOverview;
    }, [isEducationCapsule, isSafetyCapsule]);


    return (
        <div className={`min-h-screen p-6 animate-fade-in ${isHiddenMode && isSafetyCapsule ? 'bg-zinc-900 text-white' : 'bg-background text-foreground'}`}>
            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button 
                        variant={(isHiddenMode && isSafetyCapsule) ? "secondary" : "outline"} 
                        size="icon"
                        onClick={onBack}
                        className={(isHiddenMode && isSafetyCapsule) ? "bg-zinc-800 text-white hover:bg-zinc-700" : "hover:bg-muted transition-smooth"}
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
                        <p className="text-muted-foreground text-xs">Owner Key: {MOCK_OWNER_PUBLIC_KEY}</p>
                        <p className="text-muted-foreground">{config.description}</p>
                    </div>

                    <Button className={`${config.gradient} text-white hover:opacity-90 transition-smooth`}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Grant Access
                    </Button>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="permissions">Permissions</TabsTrigger>
                        <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Dynamic Overview Content */}
                        <OverviewComponent
                            // Education props
                            isEduVerifying={isEduVerifying}
                            setIsEduVerifying={setIsEduVerifying}
                            isEduVerified={isEduVerified}
                            setIsEduVerified={setIsEduVerified}
                            handleInstantVerify={handleInstantVerify}
                            VerifiedSeal={VerifiedSeal}
                            eduData={eduData}
                            setEduData={setEduData}
                            // Safety/GBV props
                            isHiddenMode={isHiddenMode}
                            setIsHiddenMode={setIsHiddenMode}
                            isSubmitting={isSubmitting}
                            setIsSubmitting={setIsSubmitting}
                            isPanicActive={isPanicActive}
                            setIsPanicActive={setIsPanicActive}
                            handleToggleHiddenMode={handleToggleHiddenMode}
                            handleSubmitReport={handleSubmitReport}
                            handlePanicButton={handlePanicButton}
                            safetyData={safetyData}
                            setSafetyData={setSafetyData}
                            // General Props
                            config={config}
                            capsuleType={capsuleType}
                        />
                    </TabsContent>
                    
                    {/* Permissions Tab (Original Mock) */}
                    <TabsContent value="permissions" className="space-y-4">
                        <p className="text-muted-foreground mb-4">
                            Manage who can access your {config.title.toLowerCase()} (via public key authorization).
                            This platform is NIST / ISO compliant, ensuring access control is paramount.
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
                                            <Badge 
                                                variant={permission.status === "active" ? "default" : "secondary"}
                                                className={permission.status === "active" ? "vault-gradient border-0 text-white" : ""}
                                            >
                                                {permission.status === "active" ? (
                                                    <>
                                                        <CheckCircle2 className="w-3 h-3 mr-1" />
                                                        Active
                                                    </>
                                                ) : (
                                                    "Pending"
                                                )}
                                            </Badge>
                                        </div>
                                        <Button variant="outline" size="sm">
                                            Revoke
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </TabsContent>

                    {/* History Tab (Original Mock - simulating BlockDAG audit trail) */}
                    <TabsContent value="history" className="space-y-4">
                        <p className="text-muted-foreground mb-4">
                            Complete BlockDAG audit trail of all transactions and data access.
                        </p>
                        <div className="relative space-y-4">
                            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-border" />
                            
                            {history.map((event, index) => (
                                <div key={index} className="flex gap-4 relative">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${
                                        event.type === "view" ? "bg-primary/10" :
                                        event.type === "edit" ? "bg-secondary/10" :
                                        "bg-accent/10"
                                    }`}>
                                        {event.type === "view" ? (
                                            <Activity className="w-5 h-5 text-primary" />
                                        ) : event.type === "edit" ? (
                                            <Pill className="w-5 h-5 text-secondary" />
                                        ) : (
                                            <Share2 className="w-5 h-5 text-accent" />
                                        )}
                                    </div>
                                    <Card className="flex-1 p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{event.action}</p>
                                                <p className="text-sm text-muted-foreground mt-1">{event.date}</p>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};
