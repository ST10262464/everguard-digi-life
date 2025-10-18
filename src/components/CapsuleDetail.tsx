import { useState } from "react";
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
  Siren
} from "lucide-react";

interface CapsuleDetailProps {
  capsuleType: string;
  onBack: () => void;
}

export const CapsuleDetail = ({ capsuleType, onBack }: CapsuleDetailProps) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data for medical capsule
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
              <div className="medical-gradient p-3 rounded-2xl text-white">
                <Heart className="w-6 h-6" />
              </div>
              <h1 className="font-heading font-bold text-3xl">Medical Capsule</h1>
            </div>
            <p className="text-muted-foreground">Your health and medical information</p>
          </div>

          <Button className="medical-gradient text-white hover:opacity-90 transition-smooth">
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
                      <div className="font-semibold text-lg text-accent">{medicalData.bloodType}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Emergency Contact</div>
                      <div className="font-semibold">{medicalData.emergencyContact.name}</div>
                      <div className="text-sm text-muted-foreground">{medicalData.emergencyContact.phone}</div>
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
                  {medicalData.allergies.map((allergy, index) => (
                    <Badge key={index} variant="destructive" className="mr-2">
                      {allergy}
                    </Badge>
                  ))}
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
                  {medicalData.medications.map((med, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm">{med}</span>
                    </div>
                  ))}
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
                  {medicalData.conditions.map((condition, index) => (
                    <Badge key={index} variant="secondary">
                      {condition}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>
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

          <TabsContent value="history" className="space-y-4">
            <p className="text-muted-foreground mb-4">
              Complete audit trail of all access and modifications to your medical capsule
            </p>
            <div className="relative space-y-4">
              {/* Timeline line */}
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
