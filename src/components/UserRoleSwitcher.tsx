import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Shield, UserX, Stethoscope } from "lucide-react";

/**
 * User Role Switcher - For Demo/Testing
 * Allows quick switching between different user personas
 */

export interface UserRole {
  id: string;
  name: string;
  role: 'patient' | 'verified_medic' | 'non_verified' | 'hacker';
  medicId?: string;
  publicKey?: string;
  description: string;
  icon: any;
  color: string;
}

export const DEMO_USERS: UserRole[] = [
  {
    id: 'user_alice',
    name: 'Alice Johnson',
    role: 'patient',
    description: 'Patient who owns medical capsules',
    icon: User,
    color: 'bg-blue-100 text-blue-800 border-blue-300'
  },
  {
    id: 'medic_joe',
    name: 'Dr. Joe Smith',
    role: 'verified_medic',
    medicId: 'medic_joe',
    publicKey: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb7',
    description: 'Verified medical professional (License: MD-12345)',
    icon: Stethoscope,
    color: 'bg-green-100 text-green-800 border-green-300'
  },
  {
    id: 'random_scanner',
    name: 'Random Bystander',
    role: 'non_verified',
    medicId: 'random_scanner',
    publicKey: '0xRandomScannerPubKey',
    description: 'Non-verified user (gets ICE view only)',
    icon: UserX,
    color: 'bg-orange-100 text-orange-800 border-orange-300'
  },
  {
    id: 'hacker_bob',
    name: 'Hacker Bob',
    role: 'hacker',
    medicId: 'hacker_bob',
    publicKey: '0xHackerBobPubKey',
    description: 'Malicious actor (blocked from medical data)',
    icon: Shield,
    color: 'bg-red-100 text-red-800 border-red-300'
  }
];

interface UserRoleSwitcherProps {
  currentUser: UserRole;
  onUserChange: (user: UserRole) => void;
  compact?: boolean;
}

export function UserRoleSwitcher({ currentUser, onUserChange, compact = false }: UserRoleSwitcherProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (compact) {
    return (
      <div className="relative">
        <div className="flex items-center gap-2 p-2 bg-white border-2 border-gray-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 flex-1">
            <div className={`p-1.5 rounded ${currentUser.color}`}>
              <currentUser.icon className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{currentUser.name}</p>
              <p className="text-xs text-gray-500 truncate">{currentUser.role.replace('_', ' ')}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            Switch
          </Button>
        </div>

        {isExpanded && (
          <>
            {/* Backdrop */}
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsExpanded(false)}
            />
            
            {/* Dropdown */}
            <div className="absolute top-full mt-2 right-0 z-50 w-80 bg-white border-2 border-gray-200 rounded-lg shadow-xl p-3 space-y-2">
              {DEMO_USERS.map((user) => (
                <button
                  key={user.id}
                  onClick={() => {
                    onUserChange(user);
                    setIsExpanded(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all hover:border-blue-400 ${
                    currentUser.id === user.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded ${user.color}`}>
                      <user.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{user.name}</p>
                      <p className="text-xs text-gray-600 truncate">{user.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg">Demo User Switcher</CardTitle>
        <CardDescription>
          Switch between different user roles to test access control
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {DEMO_USERS.map((user) => {
            const Icon = user.icon;
            const isActive = currentUser.id === user.id;

            return (
              <button
                key={user.id}
                onClick={() => onUserChange(user)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-3 rounded-lg ${user.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-base">{user.name}</h4>
                      {isActive && (
                        <Badge variant="default" className="text-xs">
                          Active
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {user.description}
                    </p>
                    
                    {user.medicId && (
                      <p className="text-xs text-gray-500 font-mono">
                        ID: {user.medicId}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-900">
            <strong>💡 Demo Tip:</strong> Switch users to test different access levels:
            <br />• <strong>Alice</strong> = Patient (owns capsules)
            <br />• <strong>Dr. Joe</strong> = Gets full access (BurstKey)
            <br />• <strong>Random</strong> = Gets ICE view only
            <br />• <strong>Hacker</strong> = Blocked attempts logged
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default UserRoleSwitcher;

