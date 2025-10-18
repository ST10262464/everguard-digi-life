import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Upload, QrCode, Sparkles, Trophy, Loader2, CheckCircle2 
} from "lucide-react";
import { GeneralOverviewProps, EducationProps } from "./CapsuleDetail";
import { uploadAndVerifyCredential } from "@/services/education-service";


// Define initial data state structure (for type consistency)
interface Credential {
    name: string;
    institution: string;
    date: string;
    verified: boolean;
}

interface EduDataState {
    credentials: Credential[];
    aiSummary: string;
    verificationToken: string | null;
}

type EducationOverviewProps = GeneralOverviewProps & EducationProps;

export const EducationOverview: React.FC<EducationOverviewProps> = ({ 
    config, 
    isEduVerifying, 
    setIsEduVerifying,
    handleInstantVerify, 
    VerifiedSeal,
    eduData,
    setEduData
}) => {
    
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // --- Core Functionality: Handle File Upload & Verification ---
    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsEduVerifying(true);
        
        try {
            const result = await uploadAndVerifyCredential(file, eduData.credentials);
            
            // 1. Update Credential list and AI Summary
            setEduData(prev => ({
                ...prev,
                aiSummary: result.aiSummary,
                verificationToken: result.verificationToken,
                credentials: result.updatedCredentials,
            }));
            
            // 2. Trigger Success Animation (via parent handler)
            handleInstantVerify();
            
        } catch (error) {
            console.error("AI Verification Failed:", error);
            alert(`AI Verification Failed: ${(error as Error).message}. Check console for details.`);
        } finally {
            setIsEduVerifying(false);
        }
    }, [setIsEduVerifying, handleInstantVerify, eduData.credentials, setEduData]);
    // -----------------------------------------------------------

    const handleGenerateQR = useCallback(() => {
        if (eduData.verificationToken) {
            alert(`Simulating QR Code Display: \n\nToken: ${eduData.verificationToken}\n\nThis token grants **one-time, read-only access** to your verified education data, linked to the BlockDAG hash. Access is only granted to the wallet public key specified during sharing.`);
        } else {
            alert("Please upload a document to generate the Instant Verify token first.");
        }
    }, [eduData.verificationToken]);


    return (
        <>
            {/* 1. Upload Credentials Card (triggers hidden file input) */}
            <Card className="p-6 border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 transition-smooth cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                />
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 rounded-xl text-primary">
                        <Upload className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-heading font-semibold text-lg mb-1">Upload Credentials</h3>
                        <p className="text-sm text-muted-foreground">
                            Securely upload documents. The BlockDAG records the integrity hash upon upload.
                        </p>
                    </div>
                    <Button className="ml-auto" disabled={isEduVerifying}>
                        {isEduVerifying ? "Processing..." : "Choose Files"}
                    </Button>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 2. Instant Verify QR Code */}
                <Card className="p-6 card-shadow md:col-span-1 flex flex-col items-center justify-center">
                    <QrCode className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="font-heading font-semibold text-lg mb-2 text-center">Instant Verify QR Code</h3>
                    <p className="text-sm text-muted-foreground text-center mb-4">
                        {eduData.verificationToken 
                            ? `Token Linked to Transaction: ${eduData.verificationToken.slice(-10)}`
                            : "Upload a document to generate a secure, BlockDAG-linked token."
                        }
                    </p>
                    <Button 
                        className={`${config.gradient} text-white hover:opacity-90`}
                        onClick={handleGenerateQR}
                        disabled={isEduVerifying || !eduData.verificationToken}
                    >
                        {isEduVerifying ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Trophy className="w-4 h-4 mr-2" />
                        )}
                        {eduData.verificationToken ? "Show/Share QR" : "Waiting for Verification"}
                    </Button>
                </Card>

                {/* 3. AI Verified Summary */}
                <Card className="p-6 card-shadow md:col-span-2 relative">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-green-500/20 rounded-xl text-green-600">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-heading font-semibold text-lg">AI Verified Summary (NIST Compliant)</h3>
                            <p className="text-sm text-muted-foreground">
                                AI confirms document authenticity, recorded by BlockDAG for non-repudiation.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Education List */}
                        <div className="p-4 border rounded-lg bg-background">
                            <h4 className="font-semibold mb-2">Credentials List</h4>
                            {eduData.credentials.map((cred, index) => (
                                <div key={index} className="flex items-center justify-between text-sm py-1 border-b last:border-b-0">
                                    <span>{cred.name} ({cred.date})</span>
                                    <Badge variant={cred.verified ? "default" : "secondary"} className={cred.verified ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                                        {cred.verified ? <CheckCircle2 className="w-3 h-3 mr-1" /> : ""}
                                        {cred.verified ? "Verified" : "Pending"}
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        {/* Summary Text */}
                        <p className="text-sm border-l-4 pl-4 py-2 border-green-500/50 italic text-foreground/80">
                            "{eduData.aiSummary}"
                        </p>
                    </div>

                    {/* Mini Success Animation Overlay */}
                    <VerifiedSeal />
                </Card>
            </div>
        </>
    );
};
