import { useState, useCallback } from "react";
import { EducationOverview } from "@/components/EducationOverview";
import { GraduationCap } from "lucide-react";

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

const Education = () => {
  const [isEduVerifying, setIsEduVerifying] = useState(false);
  const [eduData, setEduData] = useState<EduDataState>({
    credentials: [],
    aiSummary: "Upload your credentials to get started with AI-powered verification.",
    verificationToken: null
  });

  const handleInstantVerify = useCallback(() => {
    // Success animation handler
    console.log("Verification successful!");
  }, []);

  const VerifiedSeal = () => null; // Placeholder component

  const config = {
    title: "Education Capsule",
    icon: GraduationCap,
    gradient: "medical-gradient",
    description: "Your credentials and certifications"
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="font-heading font-bold text-3xl">Education</h1>
        <EducationOverview
          config={config}
          isEduVerifying={isEduVerifying}
          setIsEduVerifying={setIsEduVerifying}
          handleInstantVerify={handleInstantVerify}
          VerifiedSeal={VerifiedSeal}
          eduData={eduData}
          setEduData={setEduData}
        />
      </div>
    </div>
  );
};

export default Education;





