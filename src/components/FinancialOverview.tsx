import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Wallet, CreditCard, Building2, Shield, Plus, Trash2, Eye, Lock
} from "lucide-react";

interface FinancialAccount {
  id: string;
  type: string; // 'bank', 'investment', 'insurance', 'other'
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

type FinancialOverviewProps = {
  config: {
    title: string;
    icon: React.ComponentType<any>;
    gradient: string;
    description: string;
  };
  financialData: FinancialDataState;
  setFinancialData: React.Dispatch<React.SetStateAction<FinancialDataState>>;
};

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({ 
  config,
  financialData,
  setFinancialData
}) => {
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [showAddBeneficiary, setShowAddBeneficiary] = useState(false);
  const [newAccount, setNewAccount] = useState({
    type: 'bank',
    institution: '',
    accountNumber: ''
  });
  const [newBeneficiary, setNewBeneficiary] = useState({
    name: '',
    relationship: '',
    accessLevel: 'view' as 'view' | 'limited' | 'full'
  });

  const handleAddAccount = useCallback(() => {
    if (!newAccount.institution || !newAccount.accountNumber) {
      alert('Please fill in all account fields');
      return;
    }

    const account: FinancialAccount = {
      id: `acc_${Date.now()}`,
      type: newAccount.type,
      institution: newAccount.institution,
      accountNumber: newAccount.accountNumber,
      encrypted: true
    };

    setFinancialData(prev => ({
      ...prev,
      accounts: [...prev.accounts, account]
    }));

    setNewAccount({ type: 'bank', institution: '', accountNumber: '' });
    setShowAddAccount(false);
  }, [newAccount, setFinancialData]);

  const handleAddBeneficiary = useCallback(() => {
    if (!newBeneficiary.name || !newBeneficiary.relationship) {
      alert('Please fill in all beneficiary fields');
      return;
    }

    const beneficiary: Beneficiary = {
      id: `ben_${Date.now()}`,
      name: newBeneficiary.name,
      relationship: newBeneficiary.relationship,
      accessLevel: newBeneficiary.accessLevel
    };

    setFinancialData(prev => ({
      ...prev,
      beneficiaries: [...prev.beneficiaries, beneficiary]
    }));

    setNewBeneficiary({ name: '', relationship: '', accessLevel: 'view' });
    setShowAddBeneficiary(false);
  }, [newBeneficiary, setFinancialData]);

  const handleRemoveAccount = useCallback((id: string) => {
    setFinancialData(prev => ({
      ...prev,
      accounts: prev.accounts.filter(acc => acc.id !== id)
    }));
  }, [setFinancialData]);

  const handleRemoveBeneficiary = useCallback((id: string) => {
    setFinancialData(prev => ({
      ...prev,
      beneficiaries: prev.beneficiaries.filter(ben => ben.id !== id)
    }));
  }, [setFinancialData]);

  return (
    <>
      {/* Financial Accounts Section */}
      <Card className="p-6 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Financial Accounts</h3>
          </div>
          <Button 
            onClick={() => setShowAddAccount(!showAddAccount)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Account
          </Button>
        </div>

        {showAddAccount && (
          <Card className="p-4 mb-4 bg-muted/50">
            <div className="space-y-3">
              <div>
                <Label>Account Type</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={newAccount.type}
                  onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                >
                  <option value="bank">Bank Account</option>
                  <option value="investment">Investment</option>
                  <option value="insurance">Insurance</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <Label>Institution</Label>
                <Input
                  value={newAccount.institution}
                  onChange={(e) => setNewAccount({ ...newAccount, institution: e.target.value })}
                  placeholder="e.g., Standard Bank, Old Mutual"
                />
              </div>
              <div>
                <Label>Account Number (Last 4 digits)</Label>
                <Input
                  value={newAccount.accountNumber}
                  onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                  placeholder="****1234"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddAccount} size="sm">Add</Button>
                <Button onClick={() => setShowAddAccount(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {financialData.accounts.length > 0 ? (
            financialData.accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">{account.institution}</div>
                    <div className="text-sm text-muted-foreground">
                      {account.type} • {account.accountNumber}
                    </div>
                  </div>
                  {account.encrypted && (
                    <Badge variant="secondary" className="gap-1">
                      <Lock className="w-3 h-3" />
                      Encrypted
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAccount(account.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              No accounts added yet. Click "Add Account" to get started.
            </p>
          )}
        </div>
      </Card>

      {/* Beneficiaries Section */}
      <Card className="p-6 card-shadow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Beneficiaries</h3>
          </div>
          <Button 
            onClick={() => setShowAddBeneficiary(!showAddBeneficiary)}
            size="sm"
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Beneficiary
          </Button>
        </div>

        {showAddBeneficiary && (
          <Card className="p-4 mb-4 bg-muted/50">
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={newBeneficiary.name}
                  onChange={(e) => setNewBeneficiary({ ...newBeneficiary, name: e.target.value })}
                  placeholder="Full name"
                />
              </div>
              <div>
                <Label>Relationship</Label>
                <Input
                  value={newBeneficiary.relationship}
                  onChange={(e) => setNewBeneficiary({ ...newBeneficiary, relationship: e.target.value })}
                  placeholder="e.g., Spouse, Child, Parent"
                />
              </div>
              <div>
                <Label>Access Level</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md mt-1"
                  value={newBeneficiary.accessLevel}
                  onChange={(e) => setNewBeneficiary({ ...newBeneficiary, accessLevel: e.target.value as any })}
                >
                  <option value="view">View Only</option>
                  <option value="limited">Limited Access</option>
                  <option value="full">Full Access</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddBeneficiary} size="sm">Add</Button>
                <Button onClick={() => setShowAddBeneficiary(false)} variant="outline" size="sm">Cancel</Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-2">
          {financialData.beneficiaries.length > 0 ? (
            financialData.beneficiaries.map((beneficiary) => (
              <div key={beneficiary.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="font-semibold">{beneficiary.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {beneficiary.relationship} • {beneficiary.accessLevel} access
                    </div>
                  </div>
                  <Badge variant="outline">{beneficiary.accessLevel}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBeneficiary(beneficiary.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              No beneficiaries added yet. Click "Add Beneficiary" to designate trusted contacts.
            </p>
          )}
        </div>
      </Card>

      {/* Summary Card */}
      <Card className={`p-6 ${config.gradient} text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-heading font-semibold text-lg mb-2">Financial Summary</h3>
            <p className="text-white/80 text-sm">
              {financialData.accounts.length} account{financialData.accounts.length !== 1 ? 's' : ''} • {' '}
              {financialData.beneficiaries.length} beneficiary{financialData.beneficiaries.length !== 1 ? 'ies' : ''}
            </p>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
            <Lock className="w-3 h-3 mr-1" />
            BlockDAG Secured
          </Badge>
        </div>
      </Card>
    </>
  );
};

