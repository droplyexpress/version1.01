import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { executeSetup } from '@/lib/migration-api';

export function AdminSetupWizard() {
  const [serviceKey, setServiceKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState(1);

  const handleExecuteSetup = async () => {
    if (!serviceKey.trim()) {
      setError('Please enter your Supabase Service Role Secret');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Set the environment variable (this is a client-side call)
      // In production, this would need to be done server-side
      const response = await executeSetup(
        'manolo@droplyexpress.com',
        'M@n251428',
        'Admin Master'
      );

      if (response.success) {
        setResult(response);
        setStep(3);
      } else {
        setError(
          `Setup failed: ${response.migration?.message || response.admin?.message || 'Unknown error'}`
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Admin Setup Wizard</CardTitle>
          <CardDescription>
            Complete the setup process to enable the master admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={`step-${step}`} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="step-1">Get Key</TabsTrigger>
              <TabsTrigger value="step-2">Execute Setup</TabsTrigger>
              <TabsTrigger value="step-3">Verify</TabsTrigger>
            </TabsList>

            {/* Step 1: Get Service Key */}
            <TabsContent value="step-1" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need your Supabase Service Role Secret to proceed
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold">How to get your Service Role Secret:</h3>
                <ol className="space-y-2 text-sm list-decimal list-inside">
                  <li>Go to your Supabase Dashboard: https://supabase.io/dashboard</li>
                  <li>Select your Droply Express project</li>
                  <li>Click Settings (⚙️) → API</li>
                  <li>Copy the "Service Role Secret" (the second key)</li>
                  <li>Paste it below</li>
                </ol>

                <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded border border-blue-200 dark:border-blue-800 text-xs">
                  <p className="font-semibold mb-1">⚠️ Security Notice</p>
                  <p>
                    Keep your Service Role Secret confidential. Never commit it to git or share
                    it publicly.
                  </p>
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full"
                  disabled={!serviceKey.trim()}
                >
                  I have my Service Role Secret →
                </Button>
              </div>
            </TabsContent>

            {/* Step 2: Execute Setup */}
            <TabsContent value="step-2" className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This will create the admin user and add address fields to the database
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Service Role Secret</label>
                  <Input
                    type="password"
                    value={serviceKey}
                    onChange={(e) => setServiceKey(e.target.value)}
                    placeholder="Paste your Service Role Secret here"
                    disabled={isLoading}
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs space-y-2">
                  <p className="font-semibold">Setup will:</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Add address columns to the usuarios table</li>
                    <li>Create admin user: manolo@droplyexpress.com</li>
                    <li>Set admin password: M@n251428</li>
                  </ul>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    disabled={isLoading}
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={handleExecuteSetup}
                    disabled={isLoading || !serviceKey.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" />
                        Executing Setup...
                      </>
                    ) : (
                      'Execute Setup'
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Step 3: Verify */}
            <TabsContent value="step-3" className="space-y-4">
              {result && (
                <>
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Setup completed successfully!
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <h3 className="font-semibold">✅ What was completed:</h3>

                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Database Migration</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            Address columns added to usuarios table
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Admin User Created</p>
                          <p className="text-gray-600 dark:text-gray-400">
                            manolo@droplyexpress.com
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded text-xs space-y-2 border border-blue-200 dark:border-blue-800">
                      <p className="font-semibold">Next Steps:</p>
                      <ol className="space-y-1 list-decimal list-inside">
                        <li>Go to the login page (/login)</li>
                        <li>Use: manolo@droplyexpress.com / M@n251428</li>
                        <li>Access the admin dashboard</li>
                        <li>Start creating users and managing orders</li>
                      </ol>
                    </div>

                    <Button onClick={() => (window.location.href = '/login')} className="w-full">
                      Go to Login →
                    </Button>
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
