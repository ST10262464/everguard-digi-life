import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  LucideIcon,
  Pencil,
  Landmark,
  CreditCard,
  DollarSign,
  MessageSquare,
  BookOpen,
  Ruler, // Using Ruler for Rand symbol, as it is a common substitute when ZAR isn't available
} from "lucide-react";

// --- Configuration Data ---

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
    gradient: "legal-gradient", // Using legal-gradient for a warmer, legacy tone
    description: "Your messages and memories for loved ones"
  }
};

// --- Conversion Constants ---
// Mock conversion rate: 1 USD = 18 ZAR
const ZAR_EXCHANGE_RATE = 18;

// Utility function to convert USD-style numbers to formatted ZAR
const toZAR = (usdString: string): string => {
    const number = parseFloat(usdString.replace(/[^0-9.]/g, ''));
    const zarValue = number * ZAR_EXCHANGE_RATE;
    return `R${zarValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
};

// --- Type Definitions ---

interface FinancialData {
  netWorth: string;
  totalAssets: string;
  totalDebts: string;
  primaryBank: {
    name: string;
    accountType: string;
    contact: string;
  };
  accounts: { name: string; type: string; value: string }[];
  debts: { name: string; type: string; balance: string }[];
}

interface LegacyData {
  keyMessages: { recipient: string; status: string }[];
  journalEntries: number;
  unreleasedMedia: number;
  executor: {
    name: string;
    contact: string;
    relation: string;
  };
}

// --- Mock Data ---
// Note: Financial values are now stored as numbers for calculation, and formatted on display/save.
const mockData: Record<string, any> = {
  medical: {
    bloodType: "O+",
    allergies: ["Penicillin", "Peanuts"],
    medications: ["Lisinopril 10mg", "Metformin 500mg"],
    emergencyContact: {
      name: "Jane Doe",
      phone: "+1 (555) 123-4567",
      relation: "Spouse"
    },
    conditions: ["Type 2 Diabetes", "Hypertension"]
  },
  financial: {
    // Storing base USD amounts as strings to be converted
    netWorth: "150000",
    totalAssets: "300000",
    totalDebts: "150000",
    primaryBank: {
      name: "EverGuard Bank",
      accountType: "Checking & Savings",
      contact: "+1 (800) 555-0199",
    },
    accounts: [
      { name: "Main Checking", type: "Bank Account", value: "15000" },
      { name: "Investment Portfolio", type: "Stocks & Bonds", value: "200000" },
      { name: "Retirement 401k", type: "Retirement", value: "85000" },
    ],
    debts: [
      { name: "Home Mortgage", type: "Loan", balance: "120000" },
      { name: "Student Loan", type: "Debt", balance: "30000" },
    ]
  },
  legacy: {
    keyMessages: [
      { recipient: "Daughter, Mia", status: "Scheduled (2040)" },
      { recipient: "Son, Elias", status: "Pending Release" },
      { recipient: "Spouse, Ava", status: "Ready for Release" }
    ],
    journalEntries: 42,
    unreleasedMedia: 157,
    executor: {
      name: "Legal Guardian Smith",
      contact: "+1 (555) 987-6543",
      relation: "Legal Counsel"
    }
  },
};

const mockPermissions = [
  { name: "Dr. Sarah Johnson", access: "Full Access", expires: "30 days", status: "active", capsuleType: "medical" },
  { name: "City General Hospital", access: "Emergency Only", expires: "Never", status: "active", capsuleType: "medical" },
  
  { name: "Financial Advisor LLC", access: "View Only (Accounts)", expires: "1 year", status: "active", capsuleType: "financial" },
  { name: "Executor Law Firm", access: "Full Access (Estate)", expires: "Never", status: "pending", capsuleType: "financial" },

  { name: "Legacy Beneficiary Inc.", access: "Release on Trigger", expires: "Never", status: "active", capsuleType: "legacy" },
  { name: "Daughter, Mia", access: "Conditional Access", expires: "2040", status: "active", capsuleType: "legacy" },
];

const mockHistory = [
  { date: "2 hours ago", action: "Accessed by Dr. Sarah Johnson", type: "view", capsuleType: "medical" },
  { date: "1 day ago", action: "Updated medications list", type: "edit", capsuleType: "medical" },
  
  { date: "1 hour ago", action: "Updated asset valuation", type: "edit", capsuleType: "financial" },
  { date: "2 weeks ago", action: "Viewed by Financial Advisor LLC", type: "view", capsuleType: "financial" },
  
  { date: "5 minutes ago", action: "Added new journal entry", type: "edit", capsuleType: "legacy" },
  { date: "4 days ago", action: "Reviewed Conditional Release terms", type: "view", capsuleType: "legacy" },
  { date: "1 month ago", action: "Uploaded 5 new photos to Media Vault", type: "edit", capsuleType: "legacy" },
];

// --- Legacy Overview (View Mode) ---

const LegacyOverviewContent = ({ data, onEdit }: { data: LegacyData, onEdit: () => void }) => (
  <div className="space-y-6">
    {/* Release Status Header */}
    <Card className="p-6 border-2 border-legal/20 bg-legal/5">
      <div className="flex items-start gap-4">
        <div className="legal-gradient p-3 rounded-xl text-white">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-lg mb-2">Release Trigger Status</h3>
          <p className="text-sm text-muted-foreground mb-4">
            The Legacy Capsule is currently **Secured**. Content release is subject to predefined conditions.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Messages</div>
              <div className="font-bold text-xl text-primary">{data.keyMessages.length} Pending</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Unreleased Media</div>
              <div className="font-semibold text-lg text-primary">{data.unreleasedMedia} Files</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Journal Entries</div>
              <div className="font-semibold text-lg text-primary">{data.journalEntries}</div>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          Manage Content
        </Button>
      </div>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Key Messages */}
      <Card className="p-6 card-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-lg">Key Messages Overview</h3>
        </div>
        <div className="space-y-3">
          {data.keyMessages.map((message, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="font-medium">{message.recipient}</div>
              <Badge variant="secondary" className="mr-1">{message.status}</Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Executor Details */}
      <Card className="p-6 card-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <User className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-lg">Legacy Executor</h3>
        </div>
        <div>
          <p className="font-semibold">{data.executor.name}</p>
          <p className="text-sm text-muted-foreground">{data.executor.relation}</p>
          <p className="text-sm text-muted-foreground mt-2">Contact: {data.executor.contact}</p>
        </div>
      </Card>
      
      {/* Mock Edit Form for Legacy */}
      <Card className="p-6 card-shadow md:col-span-2">
        <h4 className="font-heading font-semibold text-lg mb-4">Manage Release Conditions</h4>
        <p className="text-sm text-muted-foreground mb-4">
          Release conditions are managed via a smart contract trigger. They are immutable once deployed.
        </p>
        <Button size="sm" variant="outline" onClick={onEdit}>
            Review Contract Terms
        </Button>
      </Card>
    </div>
  </div>
);


// --- Financial Overview (View Mode) ---
const FinancialOverviewContent = ({ data, onEdit }: { data: FinancialData, onEdit: () => void }) => (
  <div className="space-y-6">
    {/* Financial Summary Header */}
    <Card className="p-6 border-2 border-financial/20 bg-financial/5">
      <div className="flex items-start gap-4">
        <div className="financial-gradient p-3 rounded-xl text-white">
          <Wallet className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-lg mb-2">Financial Summary</h3>
          <p className="text-sm text-muted-foreground mb-4">
            A snapshot of your current financial standing (Estimated in ZAR).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Net Worth</div>
              {/* Convert USD to ZAR for display */}
              <div className="font-bold text-xl text-primary">{toZAR(data.netWorth)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Assets</div>
              {/* Convert USD to ZAR for display */}
              <div className="font-semibold text-lg text-primary">{toZAR(data.totalAssets)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Total Debts</div>
              {/* Convert USD to ZAR for display */}
              <div className="font-semibold text-lg text-destructive">{toZAR(data.totalDebts)}</div>
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="w-4 h-4 mr-2" />
          Edit Data
        </Button>
      </div>
    </Card>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Primary Bank Info */}
      <Card className="p-6 card-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Landmark className="w-5 h-5 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-lg">Primary Bank</h3>
        </div>
        <div>
          <p className="font-semibold">{data.primaryBank.name}</p>
          <p className="text-sm text-muted-foreground">{data.primaryBank.accountType}</p>
          <p className="text-sm text-muted-foreground mt-2">Contact: {data.primaryBank.contact}</p>
        </div>
      </Card>

      {/* Accounts/Assets */}
      <Card className="p-6 card-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            {/* Using a generic icon as DollarSign might be confusing for ZAR */}
            <Ruler className="w-5 h-5 text-primary" /> 
          </div>
          <h3 className="font-heading font-semibold text-lg">Key Accounts/Assets</h3>
        </div>
        <div className="space-y-3">
          {data.accounts.map((account, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="font-medium">{account.name}</div>
              <div className="text-right">
                <Badge variant="secondary" className="mr-1">{account.type}</Badge>
                {/* Convert USD to ZAR for display */}
                <span className="font-semibold text-primary">{toZAR(account.value)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Debts */}
      <Card className="p-6 card-shadow md:col-span-2">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <CreditCard className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="font-heading font-semibold text-lg">Major Debts</h3>
        </div>
        <div className="space-y-3">
          {data.debts.map((debt, index) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <div className="font-medium">{debt.name}</div>
              <div className="text-right">
                <Badge variant="destructive" className="mr-1">{debt.type}</Badge>
                {/* Convert USD to ZAR for display */}
                <span className="font-semibold text-destructive">{toZAR(debt.balance)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);

// --- Financial Edit Form (Edit Mode) ---
const FinancialEditForm = ({ data, onSave, onCancel }: { data: FinancialData, onSave: (newData: FinancialData) => void, onCancel: () => void }) => {
  // Use the raw numeric value for the input field
  const [formState, setFormState] = useState({
    netWorth: data.netWorth, // Raw USD value
    primaryBankName: data.primaryBank.name,
    primaryBankContact: data.primaryBank.contact,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.id]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save the raw numeric value (representing USD)
    const newData: FinancialData = {
      ...data,
      netWorth: formState.netWorth,
      primaryBank: {
        ...data.primaryBank,
        name: formState.primaryBankName,
        contact: formState.primaryBankContact,
      }
    };
    onSave(newData);
  };

  return (
    <Card className="p-6 space-y-6 animate-fade-in">
      <h2 className="font-heading font-bold text-2xl">Edit Financial Data</h2>
      <p className="text-muted-foreground">Editing estimated US Dollar values which are converted to ZAR for display (1 USD = {ZAR_EXCHANGE_RATE} ZAR).</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Simple Edit Fields */}
        <div>
          <Label htmlFor="netWorth">Estimated Net Worth (USD)</Label>
          <Input 
            id="netWorth" 
            type="number" 
            value={formState.netWorth} 
            onChange={handleChange} 
            placeholder="e.g. 150000"
            required
            className="text-lg font-semibold"
          />
        </div>
        <div>
          <Label htmlFor="primaryBankName">Primary Bank Name</Label>
          <Input 
            id="primaryBankName" 
            type="text" 
            value={formState.primaryBankName} 
            onChange={handleChange} 
            required
          />
        </div>
        <div>
          <Label htmlFor="primaryBankContact">Bank Contact Number</Label>
          <Input 
            id="primaryBankContact" 
            type="tel" 
            value={formState.primaryBankContact} 
            onChange={handleChange} 
            required
          />
        </div>
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" className="financial-gradient text-white">
            Save Changes
          </Button>
        </div>
      </form>
    </Card>
  );
};

// --- Main Component ---

interface CapsuleDetailProps {
  capsuleType: string;
  onBack: () => void;
}

export const CapsuleDetail = ({ capsuleType, onBack }: CapsuleDetailProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isEditing, setIsEditing] = useState(false);
  
  // Refactor: Use dynamic state for capsule data
  const initialData = mockData[capsuleType] || mockData.medical;
  const [capsuleData, setCapsuleData] = useState(initialData);

  const config = capsuleConfig[capsuleType] || capsuleConfig.medical;
  const Icon = config.icon;
  
  // Refactor: Filter permissions and history based on capsule type
  const permissions = mockPermissions.filter(p => p.capsuleType === capsuleType);
  const history = mockHistory.filter(h => h.capsuleType === capsuleType);


  const handleSave = (newData: any) => {
    setCapsuleData(newData);
    setIsEditing(false);
  };
  
  const handleEditToggle = () => setIsEditing(true);


  const renderOverviewContent = () => {
    if (capsuleType === "financial") {
      if (isEditing) {
        return <FinancialEditForm 
          data={capsuleData as FinancialData} 
          onSave={handleSave} 
          onCancel={() => setIsEditing(false)} 
        />;
      }
      return <FinancialOverviewContent 
        data={capsuleData as FinancialData} 
        onEdit={handleEditToggle} 
      />;
    }
    
    if (capsuleType === "legacy") {
      // Legacy Capsule uses its own content component
      return <LegacyOverviewContent 
        data={capsuleData as LegacyData} 
        onEdit={() => alert("Legacy Content Management UI is highly complex and not part of this demo.")} // Mock action
      />;
    }
    
    // Default (Medical) Overview Content 
    const medicalData = capsuleData;
    return (
      <div className="space-y-6">
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
            {/* Added a mock button for consistency */}
            <Button variant="outline" size="sm" onClick={() => alert('Medical Edit functionality coming soon!')}>
              <Pencil className="w-4 h-4" />
            </Button>
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
              {medicalData.allergies.map((allergy: string, index: number) => (
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
              {medicalData.medications.map((med: string, index: number) => (
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
              {medicalData.conditions.map((condition: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {condition}
                </Badge>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

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
            disabled={isEditing}
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

          <Button className={`${config.gradient} text-white hover:opacity-90 transition-smooth`} disabled={isEditing}>
            <Share2 className="w-4 h-4 mr-2" />
            Grant Access
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" disabled={isEditing}>Overview</TabsTrigger>
            <TabsTrigger value="permissions" disabled={isEditing}>Permissions</TabsTrigger>
            <TabsTrigger value="history" disabled={isEditing}>History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderOverviewContent()}
          </TabsContent>

          <TabsContent value="permissions" className="space-y-4">
            <p className="text-muted-foreground mb-4">
              Manage who can access your {config.title} and for how long
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
              Complete audit trail of all access and modifications to your {config.title}
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