import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { EmergencyFieldsHelper } from '@/components/EmergencyFieldsHelper';
import { Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:5001';

interface CapsuleCreationFormProps {
  onSuccess: () => void;
}

export function CapsuleCreationForm({ onSuccess }: CapsuleCreationFormProps) {
  const { user, token } = useAuth();
  
  const [formData, setFormData] = useState({
    bloodType: '',
    allergies: '',
    medications: '',
    conditions: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    additionalNotes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFieldSuggestion = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]}, ${value}` : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.bloodType) {
        throw new Error('Blood type is required');
      }
      if (!formData.emergencyContactName || !formData.emergencyContactPhone) {
        throw new Error('Emergency contact information is required');
      }

      // Prepare capsule data
      const capsuleData = {
        capsuleType: 'medical',
        ownerName: user?.name || 'Patient',
        bloodType: formData.bloodType,
        allergies: formData.allergies.split(',').map(s => s.trim()).filter(Boolean),
        medications: formData.medications.split(',').map(s => s.trim()).filter(Boolean),
        conditions: formData.conditions.split(',').map(s => s.trim()).filter(Boolean),
        emergencyContact: {
          name: formData.emergencyContactName,
          phone: formData.emergencyContactPhone,
          relationship: formData.emergencyContactRelationship || 'Unknown'
        },
        additionalNotes: formData.additionalNotes,
        createdAt: new Date().toISOString()
      };

      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/capsules`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user?.id,
          capsuleData,
          publicKey: `0x${user?.id}` // Demo public key
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create capsule');
      }

      const data = await response.json();
      console.log('✅ Capsule created:', data);

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Capsule creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create capsule');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Capsule Created!</h2>
              <p className="text-muted-foreground mb-4">
                Your medical data has been encrypted and secured on the blockchain.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Create Your Medical Capsule</CardTitle>
                <CardDescription>
                  Secure your emergency medical information with blockchain-backed encryption
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Auto-Suggest Helper */}
              <EmergencyFieldsHelper onFieldSuggestion={handleFieldSuggestion} />

              {/* Blood Type */}
              <div className="space-y-2">
                <Label htmlFor="bloodType">
                  Blood Type <span className="text-red-500">*</span>
                </Label>
                <select
                  id="bloodType"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.bloodType}
                  onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
                  required
                >
                  <option value="">Select blood type</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>

              {/* Allergies */}
              <div className="space-y-2">
                <Label htmlFor="allergies">Allergies</Label>
                <Textarea
                  id="allergies"
                  placeholder="e.g., Penicillin, Peanuts, Latex (comma-separated)"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Medications */}
              <div className="space-y-2">
                <Label htmlFor="medications">Current Medications</Label>
                <Textarea
                  id="medications"
                  placeholder="e.g., Lisinopril 10mg, Aspirin 81mg (comma-separated)"
                  value={formData.medications}
                  onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Medical Conditions */}
              <div className="space-y-2">
                <Label htmlFor="conditions">Medical Conditions</Label>
                <Textarea
                  id="conditions"
                  placeholder="e.g., Diabetes Type 2, Hypertension (comma-separated)"
                  value={formData.conditions}
                  onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Emergency Contact Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Emergency Contact Information</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactName">
                      Contact Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="emergencyContactName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">
                      Contact Phone <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="emergencyContactPhone"
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                    <Input
                      id="emergencyContactRelationship"
                      type="text"
                      placeholder="e.g., Spouse, Parent, Sibling"
                      value={formData.emergencyContactRelationship}
                      onChange={(e) => setFormData({ ...formData, emergencyContactRelationship: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes */}
              <div className="space-y-2">
                <Label htmlFor="additionalNotes">Additional Notes</Label>
                <Textarea
                  id="additionalNotes"
                  placeholder="Any other important medical information..."
                  value={formData.additionalNotes}
                  onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Secure Capsule...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Create Medical Capsule
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-gray-500">
                Your data will be encrypted with AES-256-GCM and logged on BlockDAG blockchain
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

