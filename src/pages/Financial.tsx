import { useState } from "react";
import { FinancialOverview } from "@/components/FinancialOverview";
import { Wallet } from "lucide-react";

interface FinancialAccount {
  id: string;
  type: string;
  institution: string;
  accountNumber: string;
  encrypted: boolean;
}

interface Beneficiary {
  id: string;
  name: string;
  relationship: string;
  accessLevel: 'view' | 'limited' | 'full';
  publicKey?: string;
}

interface FinancialDataState {
  accounts: FinancialAccount[];
  beneficiaries: Beneficiary[];
  totalAssets: string;
}

const Financial = () => {
  const [financialData, setFinancialData] = useState<FinancialDataState>({
    accounts: [],
    beneficiaries: [],
    totalAssets: "0"
  });

  const config = {
    title: "Financial Capsule",
    icon: Wallet,
    gradient: "financial-gradient",
    description: "Your financial accounts and assets"
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="font-heading font-bold text-3xl">Financial Capsule</h1>
        <FinancialOverview
          config={config}
          financialData={financialData}
          setFinancialData={setFinancialData}
        />
      </div>
    </div>
  );
};

export default Financial;





